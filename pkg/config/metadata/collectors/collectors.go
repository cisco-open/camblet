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

package collectors

import (
	"emperror.dev/errors"
	"github.com/go-logr/logr"

	"github.com/cisco-open/nasp/pkg/util"
	"github.com/gezacorp/metadatax"
)

var (
	DisabledCollectorError = errors.Sentinel("collector is disabled")
)

type BaseConfig struct {
	Enabled *bool `json:"enabled,omitempty"`
}

func (c *BaseConfig) IsEnabled() bool {
	return util.PointerToBool(c.Enabled)
}

type Config struct {
	ProcFS   ProcFSCollectorConfig   `json:"procfs,omitempty"`
	LinuxOS  LinuxOSCollectorConfig  `json:"linuxos,omitempty"`
	SysFSDMI SysFSDMICollectorConfig `json:"sysfsdmi,omitempty"`

	Azure AzureCollectorConfig `json:"azure,omitempty"`
	EC2   EC2CollectorConfig   `json:"ec2,omitempty"`
	GCP   GCPCollectorConfig   `json:"gcp,omitempty"`

	Docker     DockerCollectorConfig     `json:"docker,omitempty"`
	Kubernetes KubernetesCollectorConfig `json:"kubernetes,omitempty"`
}

func (c *Config) defaults() {
	if c.ProcFS.Enabled == nil {
		c.ProcFS.Enabled = util.BoolPointer(false)
	}

	if c.LinuxOS.Enabled == nil {
		c.LinuxOS.Enabled = util.BoolPointer(true)
	}

	if c.SysFSDMI.Enabled == nil {
		c.SysFSDMI.Enabled = util.BoolPointer(false)
	}
}

func (c Config) Validate() (Config, error) {
	var err error

	c.defaults()

	for _, obj := range []interface {
		Validate() error
	}{
		&c.ProcFS,
		&c.LinuxOS,
		&c.SysFSDMI,
		&c.Azure,
		&c.EC2,
		&c.GCP,
		&c.Docker,
		&c.Kubernetes,
	} {
		if err = obj.Validate(); err != nil {
			return c, err
		}
	}

	return c, nil
}

func GetMetadataCollector(cfg Config, logger logr.Logger) metadatax.Collector {
	collector := metadatax.NewCollectorCollection()

	for _, obj := range []interface {
		Instantiate() (metadatax.Collector, error)
	}{
		cfg.SysFSDMI,
		cfg.ProcFS,
		cfg.LinuxOS,
		cfg.Azure,
		cfg.EC2,
		cfg.GCP,
		cfg.Docker,
		cfg.Kubernetes,
	} {
		if c, err := obj.Instantiate(); err == nil {
			collector.Add(c)
		}
	}

	return collector
}
