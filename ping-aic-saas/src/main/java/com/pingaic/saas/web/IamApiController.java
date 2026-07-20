package com.pingaic.saas.web;

import com.pingaic.saas.service.LearningGuideService;
import com.pingaic.saas.service.PasswordlessAuthService;
import com.pingaic.saas.service.ProvisioningService;
import com.pingaic.saas.service.RegistrationService;
import com.pingaic.saas.service.AuditLog;
import com.pingaic.saas.web.dto.LoginStartRequest;
import com.pingaic.saas.web.dto.ProvisionRequest;
import com.pingaic.saas.web.dto.RegisterStartRequest;
import com.pingaic.saas.web.dto.VerifyOtpRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class IamApiController {
  private final LearningGuideService guideService;
  private final ProvisioningService provisioningService;
  private final RegistrationService registrationService;
  private final PasswordlessAuthService authService;
  private final AuditLog auditLog;

  public IamApiController(
      LearningGuideService guideService,
      ProvisioningService provisioningService,
      RegistrationService registrationService,
      PasswordlessAuthService authService,
      AuditLog auditLog) {
    this.guideService = guideService;
    this.provisioningService = provisioningService;
    this.registrationService = registrationService;
    this.authService = authService;
    this.auditLog = auditLog;
  }

  @GetMapping("/guide")
  public Map<String, Object> guide() {
    return guideService.overview();
  }

  @GetMapping("/audit")
  public Map<String, Object> audit() {
    return Map.of("events", auditLog.recentAsMaps());
  }

  @PostMapping("/provision")
  public Map<String, Object> provision(@Valid @RequestBody ProvisionRequest request) {
    return provisioningService.provision(request);
  }

  @GetMapping("/users")
  public Map<String, Object> users() {
    return Map.of("users", provisioningService.listUsers());
  }

  @PostMapping("/register/start")
  public Map<String, Object> registerStart(@Valid @RequestBody RegisterStartRequest request) {
    return registrationService.start(request);
  }

  @PostMapping("/register/verify")
  public Map<String, Object> registerVerify(@Valid @RequestBody VerifyOtpRequest request) {
    return registrationService.verify(request);
  }

  @PostMapping("/login/start")
  public Map<String, Object> loginStart(@Valid @RequestBody LoginStartRequest request) {
    return authService.startLogin(request);
  }

  @PostMapping("/login/verify")
  public Map<String, Object> loginVerify(@Valid @RequestBody VerifyOtpRequest request) {
    return authService.verifyLogin(request);
  }

  @GetMapping("/passwordless/magic")
  public ResponseEntity<?> magic(@RequestParam("token") String token) {
    Map<String, Object> result = authService.completeMagicLink(token);
    // Prefer JSON for API clients; browser UI uses fetch.
    return ResponseEntity.ok(result);
  }

  @GetMapping("/session/me")
  public Map<String, Object> me(
      @RequestHeader(value = "Authorization", required = false) String authorization) {
    return authService.me(authorization);
  }
}
