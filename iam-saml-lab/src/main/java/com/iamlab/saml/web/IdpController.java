package com.iamlab.saml.web;

import com.iamlab.saml.config.IamLabProperties;
import com.iamlab.saml.service.IdpSsoService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

@Controller
@RequestMapping("/idp")
public class IdpController {
  private final IdpSsoService idpSsoService;
  private final IamLabProperties properties;

  public IdpController(IdpSsoService idpSsoService, IamLabProperties properties) {
    this.idpSsoService = idpSsoService;
    this.properties = properties;
  }

  @GetMapping("/sso")
  public String ssoGet(
      @RequestParam("SAMLRequest") String samlRequest,
      @RequestParam(value = "RelayState", required = false) String relayState,
      @RequestParam(value = "flowId", required = false) String flowId,
      HttpServletRequest request,
      Model model) {
    Map<String, Object> inspect =
        idpSsoService.inspectIncomingRequest(samlRequest, relayState, flowId);
    model.addAttribute("inspect", inspect);
    model.addAttribute("samlRequest", samlRequest);
    model.addAttribute("relayState", relayState);
    model.addAttribute("flowId", inspect.get("flowId"));
    model.addAttribute("requestId", inspect.get("requestId"));

    String idpToken = readCookie(request, properties.getIdp().getSessionCookie());
    model.addAttribute("hasIdpSession", idpToken != null);
    model.addAttribute("idpEntityId", properties.getIdp().getEntityId());
    return "idp-login";
  }

  @PostMapping("/sso")
  public String ssoPost(
      @RequestParam(value = "username", required = false) String username,
      @RequestParam(value = "password", required = false) String password,
      @RequestParam("requestId") String requestId,
      @RequestParam(value = "RelayState", required = false) String relayState,
      @RequestParam(value = "flowId", required = false) String flowId,
      @RequestParam(value = "useExistingSession", defaultValue = "false") boolean useExistingSession,
      HttpServletRequest request,
      HttpServletResponse response,
      Model model) {
    String existing =
        useExistingSession ? readCookie(request, properties.getIdp().getSessionCookie()) : null;
    try {
      Map<String, Object> issued =
          idpSsoService.issueResponse(
              username, password, requestId, relayState, flowId, existing);
      Cookie cookie =
          new Cookie(
              properties.getIdp().getSessionCookie(), String.valueOf(issued.get("idpSessionToken")));
      cookie.setPath("/");
      cookie.setHttpOnly(true);
      response.addCookie(cookie);

      model.addAttribute("acsUrl", issued.get("acsUrl"));
      model.addAttribute("samlResponse", issued.get("samlResponse"));
      model.addAttribute("relayState", issued.get("relayState"));
      model.addAttribute("flowId", issued.get("flowId"));
      model.addAttribute("responsePretty", issued.get("responsePretty"));
      model.addAttribute("parsed", issued.get("parsed"));
      model.addAttribute("explain", issued.get("explain"));
      return "idp-post-response";
    } catch (ResponseStatusException ex) {
      model.addAttribute("error", ex.getReason());
      model.addAttribute("requestId", requestId);
      model.addAttribute("relayState", relayState);
      model.addAttribute("flowId", flowId);
      model.addAttribute("idpEntityId", properties.getIdp().getEntityId());
      model.addAttribute(
          "inspect",
          Map.of(
              "demoHint",
              properties.getDemo().getHint(),
              "demoUsers",
              java.util.List.of(),
              "requestId",
              requestId));
      model.addAttribute("hasIdpSession", false);
      return "idp-login";
    }
  }

  @GetMapping("/logout")
  public String logout(HttpServletResponse response) {
    Cookie clear = new Cookie(properties.getIdp().getSessionCookie(), "");
    clear.setPath("/");
    clear.setMaxAge(0);
    response.addCookie(clear);
    return "redirect:/?idpLogout=1";
  }

  private static String readCookie(HttpServletRequest request, String name) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return null;
    }
    for (Cookie cookie : cookies) {
      if (name.equals(cookie.getName())) {
        return cookie.getValue();
      }
    }
    return null;
  }
}
