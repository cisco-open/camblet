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
	"encoding/json"

	"emperror.dev/errors"
	"github.com/go-logr/logr"
	"github.com/werbenhu/eventbus"

	"github.com/cisco-open/camblet/api/v1/agent/trace"
	"github.com/cisco-open/camblet/api/v1/core"
	"github.com/cisco-open/camblet/pkg/agent/messenger"
)

type logCommand struct {
	eventBus *eventbus.EventBus
	logger   logr.Logger
}

func Log(eventBus *eventbus.EventBus, logger logr.Logger) CommandHandler {
	return &logCommand{
		eventBus: eventBus,
		logger:   logger,
	}
}

func (c *logCommand) HandleCommand(cmd messenger.Command) (string, error) {
	var data map[string]string

	if err := json.Unmarshal([]byte(cmd.Data), &data); err != nil {
		return "error", err
	}

	message := data["message"]
	delete(data, "message")

	resp := &trace.TraceResponse{
		Context: &core.CommandContext{
			Pid:         uint32(cmd.Context.PID),
			Uid:         uint32(cmd.Context.UID),
			Gid:         uint32(cmd.Context.GID),
			CommandName: cmd.Context.CommandName,
			CommandPath: cmd.Context.CommandPath,
			CgroupPath:  cmd.Context.CGroupPath,
		},
		Message: message,
		Values:  data,
	}

	c.logger.Info("public trace response")
	if err := c.eventBus.Publish(messenger.TraceResponse, resp); err != nil {
		return "error", errors.WrapIf(err, "could not publish trace response")
	}

	return "ok", nil
}
