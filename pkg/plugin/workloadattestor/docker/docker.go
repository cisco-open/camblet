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

package docker

import (
	"context"
	"fmt"
	"os"
	"strings"

	"emperror.dev/errors"
	dockerapitypes "github.com/docker/docker/api/types"

	"github.com/cisco-open/nasp/api/types"
	"github.com/cisco-open/nasp/pkg/plugin"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor"
)

const (
	attestorName = "docker"

	networkModeKey = "network:mode"
	imageNameKey   = "image:name"
	imageHashKey   = "image:hash"
	envKey         = "env"
	labelKey       = "label"
)

type attestor struct {
	config Config
}

func New(config Config) workloadattestor.WorkloadAttestor {
	return &attestor{
		config: config,
	}
}

func (a *attestor) Name() string {
	return attestorName
}

func (a *attestor) Type() plugin.PluginType {
	return plugin.WorkloadAttestatorPluginType
}

func (a *attestor) Attest(ctx context.Context, pid int32) (*types.Tags, error) {
	cgroupList, err := GetCgroups(pid)
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	tags := workloadattestor.InitTagsWithPrefix(attestorName)

	var cid string
	var found bool
	for _, cgroup := range cgroupList {
		cid, found = FindContainerID(cgroup.CGroupPath)
		if found {
			break
		}
	}

	if !found {
		return tags.Tags, nil
	}

	dc, err := a.config.getDockerClient()
	if err != nil {
		return nil, errors.WithStack(err)
	}

	cj, err := dc.ContainerInspect(ctx, cid)
	if err != nil {
		return nil, err
	}

	for _, f := range []func(dockerapitypes.ContainerJSON, *workloadattestor.Tags){
		a.envs,
		a.image,
		a.labels,
		a.network,
	} {
		f(cj, tags)
	}

	return tags.Tags, nil
}

func (a *attestor) network(cj dockerapitypes.ContainerJSON, tags *workloadattestor.Tags) {
	tags.Add(networkModeKey, string(cj.HostConfig.NetworkMode))
}

func (a *attestor) image(cj dockerapitypes.ContainerJSON, tags *workloadattestor.Tags) {
	tags.Add(imageNameKey, cj.Config.Image)
	tags.Add(imageHashKey, cj.Image)
}

func (a *attestor) labels(cj dockerapitypes.ContainerJSON, tags *workloadattestor.Tags) {
	for k, v := range cj.Config.Labels {
		tags.Add(fmt.Sprintf("%s:%s", labelKey, k), v)
	}
}

func (a *attestor) envs(cj dockerapitypes.ContainerJSON, tags *workloadattestor.Tags) {
	for _, env := range cj.Config.Env {
		if !strings.Contains(env, "=") {
			continue
		}
		p := strings.SplitN(env, "=", 2)
		tags.Add(fmt.Sprintf("%s:%s", envKey, strings.ToUpper(p[0])), p[1])
	}
}
