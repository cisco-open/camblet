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

package trace

import (
	"emperror.dev/errors"
	"github.com/go-logr/logr"
	"github.com/werbenhu/eventbus"

	trace_v1 "github.com/cisco-open/camblet/api/v1/agent/trace"
	"github.com/cisco-open/camblet/pkg/agent/messenger"
)

type service struct {
	trace_v1.UnimplementedTracesServer

	eventBus *eventbus.EventBus
	logger   logr.Logger
}

func New(eventBus *eventbus.EventBus, logger logr.Logger) trace_v1.TracesServer {
	return &service{
		eventBus: eventBus,
		logger:   logger,
	}
}

func (s *service) Trace(req *trace_v1.TraceRequest, srv trace_v1.Traces_TraceServer) error {
	logger := s.logger.V(1)
	logger.Info("publish trace request addition")

	if err := s.eventBus.PublishSync(messenger.TraceRequest, messenger.TraceRequestMessage{
		TraceRequest: req,
		Action:       messenger.AddTraceRequestAction,
	}); err != nil {
		return errors.WrapIf(err, "could not publish trace request addition")
	}

	handler := func(topic string, resp *trace_v1.TraceResponse) {
		if s.matchResponse(req, resp) {
			if err := srv.Send(resp); err != nil {
				s.logger.Error(err, "could not send trace response to stream")
			}
		}
	}

	logger.Info("subscribe to trace responses")
	s.eventBus.Subscribe(messenger.TraceResponse, handler)

	<-srv.Context().Done()

	logger.Info("unsubscribe from trace responses")
	s.eventBus.Unsubscribe(messenger.TraceResponse, handler)

	logger.Info("publish trace request removal")
	if err := s.eventBus.PublishSync(messenger.TraceRequest, messenger.TraceRequestMessage{
		TraceRequest: req,
		Action:       messenger.RemoveTraceRequestAction,
	}); err != nil {
		return errors.WrapIf(err, "could not publish trace request removal")
	}

	return nil
}

func (s *service) matchResponse(req *trace_v1.TraceRequest, resp *trace_v1.TraceResponse) bool {
	if req.Pid > 0 && req.Pid != resp.Context.Pid {
		return false
	}

	if req.Uid != nil {
		if *req.Uid != resp.Context.Uid {
			return false
		}
	}

	if req.CommandName != "" && req.CommandName != resp.Context.CommandName {
		return false
	}

	return true
}
