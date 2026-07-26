package com.iamlab.saml.web;

import com.iamlab.saml.config.IamLabProperties;
import com.iamlab.saml.service.SpSsoService;
import com.iamlab.saml.store.LabStore.SpSession;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/sp")
public class SpController {
  private final SpSsoService spSsoService;
  private final IamLabProperties properties;

  public SpController(SpSsoService spSsoService, IamLabProperties properties) {
    this.spSsoService = spSsoService;
    this.properties = properties;
  }

  @GetMapping({"/", "/app"})
  public String app(HttpServletRequest request, Model model) {
    String token = readCookie(request, properties.getSp().getSessionCookie());
    boolean authenticated = false;
    Map<String, Object> session = null;
    if (token != null) {
      try {
        session = spSsoService.sessionView(token);
        authenticated = true;
      } catch (Exception ignored) {
        authenticated = false;
      }
    }
    model.addAttribute("authenticated", authenticated);
    model.addAttribute("session", session);
    model.addAttribute("spEntityId", properties.getSp().getEntityId());
    return "sp-app";
  }

  @GetMapping("/login")
  public void login(
      @RequestParam(defaultValue = "/sp/app") String relayState,
      @RequestParam(defaultValue = "false") boolean forceAuthn,
      HttpServletResponse response)
      throws IOException {
    Map<String, Object> begin = spSsoService.beginSso(relayState, forceAuthn);
    response.sendRedirect(String.valueOf(begin.get("redirectUrl")));
  }

  @GetMapping("/start")
  public String startPreview(
      @RequestParam(defaultValue = "/sp/app") String relayState,
      @RequestParam(defaultValue = "false") boolean forceAuthn,
      Model model) {
    Map<String, Object> begin = spSsoService.beginSso(relayState, forceAuthn);
    model.addAttribute("begin", begin);
    model.addAttribute("spEntityId", properties.getSp().getEntityId());
    model.addAttribute("idpSsoUrl", properties.getIdp().getSsoUrl());
    return "sp-start";
  }

  @PostMapping("/acs")
  public String acs(
      @RequestParam("SAMLResponse") String samlResponse,
      @RequestParam(value = "RelayState", required = false) String relayState,
      @RequestParam(value = "flowId", required = false) String flowId,
      HttpServletResponse response,
      Model model) {
    SpSession session = spSsoService.consumeResponse(samlResponse, relayState, flowId);
    Cookie cookie = new Cookie(properties.getSp().getSessionCookie(), session.token());
    cookie.setPath("/");
    cookie.setHttpOnly(true);
    response.addCookie(cookie);

    model.addAttribute("session", session.toView());
    model.addAttribute("relayState", relayState == null || relayState.isBlank() ? "/sp/app" : relayState);
    model.addAttribute("flowId", session.flowId());
    return "sp-acs-result";
  }

  @GetMapping("/logout")
  public String logout(HttpServletRequest request, HttpServletResponse response) {
    Cookie clear = new Cookie(properties.getSp().getSessionCookie(), "");
    clear.setPath("/");
    clear.setMaxAge(0);
    response.addCookie(clear);
    return "redirect:/sp/app";
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
