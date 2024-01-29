/*
 * The MIT License (MIT)
 * Copyright (c) 2024 Cisco and/or its affiliates. All rights reserved.
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

package server

import (
	"context"
	"net"

	"github.com/go-logr/logr"
	"github.com/werbenhu/eventbus"
	"google.golang.org/grpc"

	trace_v1_api "github.com/cisco-open/camblet/api/v1/agent/trace"
	trace_v1 "github.com/cisco-open/camblet/pkg/agent/api/v1/trace"
	"github.com/cisco-open/camblet/pkg/config"
)

type Server interface {
	Serve(ctx context.Context, l net.Listener) error
	ListenAndServe(ctx context.Context) error
}

type server struct {
	config   config.Agent
	eventBus *eventbus.EventBus
	logger   logr.Logger
}

func New(config config.Agent, eventBus *eventbus.EventBus, logger logr.Logger) Server {
	return &server{
		config:   config,
		eventBus: eventBus,
		logger:   logger,
	}
}

func (s *server) ListenAndServe(ctx context.Context) error {
	l, err := net.Listen("tcp", s.config.LocalAddress)
	if err != nil {
		return err
	}

	return s.Serve(ctx, l)
}

func (s *server) Serve(ctx context.Context, l net.Listener) error {
	server := grpc.NewServer()
	trace_v1_api.RegisterTracesServer(server, trace_v1.New(s.eventBus, s.logger))

	s.logger.Info("starting Agent APIs")
	errChan := make(chan error)
	go func() { errChan <- server.Serve(l) }()

	select {
	case err := <-errChan:
		s.logger.Error(err, "agent APIs stopped prematurely")
		return err
	case <-ctx.Done():
		s.logger.Info("stopping agent APIs")
		server.Stop()
		<-errChan
		s.logger.Info("agent APIs have stopped")
		return nil
	}
}
