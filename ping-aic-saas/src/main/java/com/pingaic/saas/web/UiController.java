package com.pingaic.saas.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class UiController {
  @GetMapping({"/", "/app", "/lab"})
  public String index() {
    return "index";
  }
}
