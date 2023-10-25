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

package linux

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

	"github.com/shirou/gopsutil/v3/process"

	"github.com/cisco-open/nasp/api/types"
	"github.com/cisco-open/nasp/pkg/plugin"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor"
	"github.com/cisco-open/nasp/pkg/util"
)

const (
	attestorName    = "linux"
	defaultProcPath = "/proc"

	envKey           = "env"
	uidKey           = "uid"
	effectiveUIDKey  = "effective_uid"
	realUIDKey       = "real_uid"
	gidKey           = "gid"
	effectiveGIDKey  = "effective_gid"
	realGIDKey       = "real_gid"
	additionalGIDKey = "additional_gid"
	binaryNameKey    = "binary:name"
	binaryPathKey    = "binary:path"
	binaryHashKey    = "binary:sha256"
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
	p, err := process.NewProcess(pid)
	if err != nil {
		return nil, err
	}

	tags := workloadattestor.InitTagsWithPrefix(attestorName)
	extractors := []func(context.Context, *process.Process, *workloadattestor.Tags){
		a.uids,
		a.gids,
		a.additional_gids,
		a.binary,
	}
	if util.PointerToBool(a.config.ExtractEnvs) {
		extractors = append(extractors, a.envs)
	}
	for _, f := range extractors {
		f(ctx, p, tags)
	}

	return tags.Tags, nil
}

func (a *attestor) uids(ctx context.Context, p *process.Process, tags *workloadattestor.Tags) {
	if uids, err := p.UidsWithContext(ctx); err == nil {
		if len(uids) == 4 {
			tags.Add(uidKey, fmt.Sprintf("%d", uids[1]))
			tags.Add(realUIDKey, fmt.Sprintf("%d", uids[0]))
			tags.Add(effectiveUIDKey, fmt.Sprintf("%d", uids[1]))
		}
	}
}

func (a *attestor) gids(ctx context.Context, p *process.Process, tags *workloadattestor.Tags) {
	if gids, err := p.GidsWithContext(ctx); err == nil {
		if len(gids) == 4 {
			tags.Add(gidKey, fmt.Sprintf("%d", gids[1]))
			tags.Add(realGIDKey, fmt.Sprintf("%d", gids[0]))
			tags.Add(effectiveGIDKey, fmt.Sprintf("%d", gids[1]))
		}
	}
}

func (a *attestor) additional_gids(ctx context.Context, p *process.Process, tags *workloadattestor.Tags) {
	if groups, err := p.GroupsWithContext(ctx); err == nil {
		for _, groupID := range groups {
			tags.Add(additionalGIDKey, fmt.Sprintf("%d", groupID))
		}
	}
}

func (a *attestor) envs(ctx context.Context, p *process.Process, tags *workloadattestor.Tags) {
	if envs, err := p.EnvironWithContext(ctx); err == nil {
		for _, env := range envs {
			if !strings.Contains(env, "=") {
				continue
			}
			p := strings.SplitN(env, "=", 2)
			tags.Add(fmt.Sprintf("%s:%s", envKey, strings.ToUpper(p[0])), p[1])
		}
	}
}

func (a *attestor) binary(ctx context.Context, p *process.Process, tags *workloadattestor.Tags) {
	exe, err := p.ExeWithContext(ctx)
	if err != nil {
		return
	}

	tags.Add(binaryPathKey, exe)
	tags.Add(binaryNameKey, filepath.Base(exe))

	root := GetProcPath(p.Pid, "root")
	exePath := filepath.Join(root, exe)
	if size, err := GetSHA256Digest(exePath, 0); err == nil {
		tags.Add(binaryHashKey, size)
	}
}
