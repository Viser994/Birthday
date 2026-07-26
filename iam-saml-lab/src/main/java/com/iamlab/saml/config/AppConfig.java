package com.iamlab.saml.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(IamLabProperties.class)
public class AppConfig {}
