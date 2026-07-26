package com.iamlab.saml;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SamlFlowIT {

  @Autowired TestRestTemplate rest;

  @Test
  void guideAndFullSamlRoundTrip() {
    ResponseEntity<Map> guide = rest.getForEntity("/api/guide", Map.class);
    assertThat(guide.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(guide.getBody()).containsKey("concepts");

    ResponseEntity<String> start = rest.getForEntity("/sp/start?relayState=/sp/app", String.class);
    assertThat(start.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(start.getBody()).contains("AuthnRequest");

    String redirectHtml =
        rest.getForEntity("/sp/login?relayState=/sp/app", String.class).getHeaders().getFirst("Location");
    // login uses sendRedirect — follow manually if needed
    ResponseEntity<String> loginRedirect =
        rest.getForEntity("/sp/login?relayState=/sp/app", String.class);
    assertThat(loginRedirect.getStatusCode().is3xxRedirection() || loginRedirect.getStatusCode().is2xxSuccessful())
        .isTrue();

    String location = loginRedirect.getHeaders().getLocation() != null
        ? loginRedirect.getHeaders().getLocation().toString()
        : loginRedirect.getHeaders().getFirst("Location");
    assertThat(location).contains("/idp/sso");
    assertThat(location).contains("SAMLRequest=");

    ResponseEntity<String> idpPage = rest.getForEntity(location, String.class);
    assertThat(idpPage.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(idpPage.getBody()).contains("Campus IdP");

    String requestId = extract(idpPage.getBody(), "name=\"requestId\" value=\"([^\"]+)\"");
    String flowId = extract(idpPage.getBody(), "name=\"flowId\" value=\"([^\"]+)\"");
    assertThat(requestId).isNotBlank();

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
    MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("username", "alice");
    form.add("password", "password");
    form.add("requestId", requestId);
    form.add("RelayState", "/sp/app");
    form.add("flowId", flowId);
    ResponseEntity<String> issued =
        rest.postForEntity("/idp/sso", new HttpEntity<>(form, headers), String.class);
    assertThat(issued.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(issued.getBody()).contains("SAMLResponse");
    assertThat(issued.getBody()).contains("NameID");

    String samlResponse = extract(issued.getBody(), "name=\"SAMLResponse\" value=\"([^\"]+)\"");
    assertThat(samlResponse).isNotBlank();

    MultiValueMap<String, String> acs = new LinkedMultiValueMap<>();
    acs.add("SAMLResponse", samlResponse);
    acs.add("RelayState", "/sp/app");
    acs.add("flowId", flowId);
    ResponseEntity<String> acsResult =
        rest.postForEntity("/sp/acs", new HttpEntity<>(acs, headers), String.class);
    assertThat(acsResult.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(acsResult.getBody()).contains("SSO complete");
    assertThat(acsResult.getBody()).contains("alice@example.com");
  }

  private static String extract(String html, String regex) {
    Matcher m = Pattern.compile(regex).matcher(html == null ? "" : html);
    return m.find() ? m.group(1) : "";
  }
}
