/*
 * The MIT License (MIT)
 * Copyright (c) 2023 Cisco and/or its affiliates. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 * TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package config

import (
	"time"

	"emperror.dev/errors"

	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/docker"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/k8s"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/linux"
	"github.com/cisco-open/nasp/pkg/util"
)

const (
	DefaultTrustDomain     = "nasp"
	DefaultCertTTLDuration = time.Hour * 24
)

type Agent struct {
	LocalAddress           string                 `json:"localAddress,omitempty"`
	KernelModuleDevice     string                 `json:"kernelModuleDevice,omitempty"`
	WorkloadAttestors      AgentWorkloadAttestors `json:"workloadAttestors,omitempty"`
	TrustDomain            string                 `json:"trustDomain,omitempty"`
	DefaultCertTTL         string                 `json:"defaultCertTTL,omitempty"`
	DefaultCertTTLDuration time.Duration          `json:"-"`
}

func (c Agent) Validate() (Agent, error) {
	var err error

	if c.TrustDomain == "" {
		c.TrustDomain = DefaultTrustDomain
	}

	if c.DefaultCertTTL == "" {
		c.DefaultCertTTL = DefaultCertTTLDuration.String()
	}

	if d, err := time.ParseDuration(c.DefaultCertTTL); err != nil {
		return c, errors.WrapIf(err, "invalid default certificate ttl")
	} else {
		c.DefaultCertTTLDuration = d
	}

	c.WorkloadAttestors, err = c.WorkloadAttestors.Validate()
	if err != nil {
		return c, err
	}

	return c, nil
}

type AgentWorkloadAttestors struct {
	Linux struct {
		linux.Config `json:",inline" mapstructure:",squash"`
		Enabled      *bool `json:"enabled,omitempty"`
	} `json:"linux,omitempty"`
	Docker struct {
		docker.Config `json:",inline" mapstructure:",squash"`
		Enabled       *bool `json:"enabled,omitempty"`
	} `json:"docker,omitempty"`
	K8s struct {
		k8s.Config `json:",inline" mapstructure:",squash"`
		Enabled    *bool `json:"enabled,omitempty"`
	} `json:"k8s,omitempty"`
}

func (c AgentWorkloadAttestors) Validate() (AgentWorkloadAttestors, error) {
	var err error

	if c.Linux.Enabled == nil {
		c.Linux.Enabled = util.BoolPointer(true)
	}

	c.Linux.Config, err = c.Linux.Validate()
	if err != nil {
		return c, err
	}

	if c.Docker.Enabled == nil {
		c.Docker.Enabled = util.BoolPointer(false)
	}

	c.Docker.Config, err = c.Docker.Validate()
	if err != nil {
		return c, err
	}

	if c.K8s.Enabled == nil {
		c.K8s.Enabled = util.BoolPointer(false)
	}

	c.K8s.Config, err = c.K8s.Validate()
	if err != nil {
		return c, err
	}

	return c, nil
}
