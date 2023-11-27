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

package commands

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/go-logr/logr"
	"github.com/jellydator/ttlcache/v3"
	"github.com/shirou/gopsutil/v3/process"

	"github.com/cisco-open/nasp/pkg/agent/messenger"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/docker"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/linux"
)

type attestCommand struct {
	attestor workloadattestor.WorkloadAttestors
	logger   logr.Logger
	cache    *ttlcache.Cache[string, string]
}

func Attest(ctx context.Context, attestor workloadattestor.WorkloadAttestors, logger logr.Logger) CommandHandler {
	cmd := &attestCommand{
		attestor: attestor,
		logger:   logger,
		cache: ttlcache.New[string, string](
			ttlcache.WithTTL[string, string](5 * time.Minute),
		),
	}

	go func() {
		cmd.cache.Start()
		<-ctx.Done()
		cmd.cache.Stop()
	}()

	cmd.init()

	return cmd
}

func (c *attestCommand) HandleCommand(cmd messenger.Command) (string, error) {
	c.cache.DeleteExpired()

	cacheKey := cmd.Context.UniqueString()

	logger := c.logger.WithValues("pid", cmd.Context.PID, "path", cmd.Context.CommandPath, "cacheKey", cacheKey)

	if item := c.cache.Get(cacheKey); item != nil {
		logger.V(1).Info("attest response cache hit")

		return item.Value(), nil
	}

	tags, err := c.attestor.Attest(context.Background(), int32(cmd.Context.PID))
	if err != nil {
		return "error", err
	}

	var response struct {
		Labels map[string]bool `json:"labels"`
	}
	response.Labels = make(map[string]bool)

	for _, v := range tags.Entries {
		response.Labels[fmt.Sprintf("%s:%s", v.Key, v.Value)] = true
	}

	j, err := json.Marshal(response)
	if err != nil {
		return "error", err
	}

	js := string(j)
	c.cache.Set(cmd.Context.UniqueString(), js, ttlcache.DefaultTTL)
	logger.V(2).Info("attest response cached")

	return js, nil
}

func (c *attestCommand) init() {
	pids, err := process.Pids()
	if err != nil {
		c.logger.Error(err, "could not get pids")
	}

	for _, pid := range pids {
		logger := c.logger.WithValues("pid", pid)
		cmdCtx, err := getCMDContextFromPID(pid)
		if err != nil && !errors.Is(err, os.ErrNotExist) && !errors.Is(err, os.ErrPermission) {
			logger.Error(err, "could not get command context for pid")
			continue
		}

		c.HandleCommand(messenger.Command{
			Context: cmdCtx,
		})
	}
}

func getCMDContextFromPID(pid int32) (ctx messenger.CommandContext, err error) {
	p, err := process.NewProcess(pid)
	if err != nil {
		return ctx, err
	}

	ctx.PID = int(pid)

	if cgroups, err := docker.GetCgroups(pid); err != nil {
		return ctx, err
	} else if len(cgroups) > 0 {
		ctx.CGroupPath = cgroups[0].CGroupPath
	}

	ctx.CommandName, err = p.Name()
	if err != nil {
		return ctx, err
	}

	ctx.CommandPath, err = p.Exe()
	if err != nil {
		return ctx, err
	}

	if uids, err := p.Uids(); err != nil {
		return ctx, err
	} else if len(uids) > 0 {
		ctx.UID = int(uids[0])
	}

	if gids, err := p.Gids(); err != nil {
		return ctx, err
	} else if len(gids) > 0 {
		ctx.GID = int(gids[0])
	}

	base := linux.GetProcPath(pid, "ns")

	entries, err := os.ReadDir(base)
	if err != nil {
		return ctx, err
	}

	namespaceIDs := map[string]int{}

	for _, entry := range entries {
		s, err := os.Readlink(filepath.Join(base, entry.Name()))
		if err != nil {
			return ctx, err
		}

		if id, err := strconv.Atoi(s[strings.IndexByte(s, '[')+1 : strings.IndexByte(s, ']')]); err == nil {
			namespaceIDs[entry.Name()] = id
		}
	}

	ctx.NamespaceIDs.CGroup = int64(namespaceIDs["cgroup"])
	ctx.NamespaceIDs.IPC = int64(namespaceIDs["ipc"])
	ctx.NamespaceIDs.Mount = int64(namespaceIDs["mnt"])
	ctx.NamespaceIDs.Network = int64(namespaceIDs["net"])
	ctx.NamespaceIDs.PID = int64(namespaceIDs["pid"])
	ctx.NamespaceIDs.Time = int64(namespaceIDs["time"])
	ctx.NamespaceIDs.UTS = int64(namespaceIDs["uts"])

	return ctx, nil
}
