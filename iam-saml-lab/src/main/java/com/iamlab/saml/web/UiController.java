package com.iamlab.saml.web;

import com.iamlab.saml.config.IamLabProperties;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class UiController {
  private final IamLabProperties properties;

  public UiController(IamLabProperties properties) {
    this.properties = properties;
  }

  @GetMapping({"/", "/lab"})
  public String index(Model model) {
    model.addAttribute("appName", properties.getAppName());
    model.addAttribute("demoHint", properties.getDemo().getHint());
    model.addAttribute("spEntityId", properties.getSp().getEntityId());
    model.addAttribute("idpEntityId", properties.getIdp().getEntityId());
    return "index";
  }
}
