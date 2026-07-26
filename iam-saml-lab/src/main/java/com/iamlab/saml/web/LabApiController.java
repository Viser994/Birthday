package com.iamlab.saml.web;

import com.iamlab.saml.config.IamLabProperties;
import com.iamlab.saml.domain.FlowTrace;
import com.iamlab.saml.service.LearningGuideService;
import com.iamlab.saml.service.SpSsoService;
import com.iamlab.saml.store.LabStore;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LabApiController {
  private final LearningGuideService guideService;
  private final SpSsoService spSsoService;
  private final LabStore store;
  private final IamLabProperties properties;

  public LabApiController(
      LearningGuideService guideService,
      SpSsoService spSsoService,
      LabStore store,
      IamLabProperties properties) {
    this.guideService = guideService;
    this.spSsoService = spSsoService;
    this.store = store;
    this.properties = properties;
  }

  @GetMapping("/guide")
  public Map<String, Object> guide() {
    return guideService.overview();
  }

  @GetMapping("/flow")
  public Map<String, Object> flow(@RequestParam(required = false) String flowId) {
    FlowTrace flow =
        flowId != null && !flowId.isBlank()
            ? store.findFlow(flowId).orElse(null)
            : store.latestFlow();
    if (flow == null) {
      return Map.of("status", "NONE", "steps", java.util.List.of());
    }
    return flow.toView();
  }

  @GetMapping("/session")
  public Map<String, Object> session(HttpServletRequest request) {
    String token = readCookie(request, properties.getSp().getSessionCookie());
    Map<String, Object> view = new LinkedHashMap<>();
    if (token == null) {
      view.put("authenticated", false);
      return view;
    }
    try {
      view.put("authenticated", true);
      view.put("session", spSsoService.sessionView(token));
    } catch (Exception e) {
      view.put("authenticated", false);
    }
    String idp = readCookie(request, properties.getIdp().getSessionCookie());
    view.put("idpSessionPresent", idp != null && store.findIdpUsername(idp).isPresent());
    return view;
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
