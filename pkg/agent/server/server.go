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

package server

import (
	"context"
	"net"
	"os"

	"github.com/go-logr/logr"
	"github.com/werbenhu/eventbus"
	"google.golang.org/grpc"

	apicommonv1 "github.com/cisco-open/nasp/api/agent/common/v1"
	commonv1 "github.com/cisco-open/nasp/pkg/agent/api/common/v1"
	"github.com/cisco-open/nasp/pkg/config"
)

type Server interface {
	ListenAndServe(ctx context.Context) error
}

type server struct {
	conf     config.Agent
	eventBus *eventbus.EventBus
	logger   logr.Logger
}

func New(conf config.Agent, eventBus *eventbus.EventBus, logger logr.Logger) Server {
	return &server{
		conf:     conf,
		eventBus: eventBus,
		logger:   logger,
	}
}

func (s *server) ListenAndServe(ctx context.Context) error {
	server := grpc.NewServer()

	apicommonv1.RegisterCommonServer(server, commonv1.New(s.eventBus))

	localAddr, err := getUnixAddr(s.conf.LocalAddress)
	if err != nil {
		return err
	}

	_ = os.Remove(localAddr.String())
	if err := prepareLocalAddr(localAddr); err != nil {
		return err
	}

	l, err := net.Listen(localAddr.Network(), localAddr.String())
	if err != nil {
		return err
	}

	log := s.logger

	log.Info("starting Agent APIs")
	errChan := make(chan error)
	go func() { errChan <- server.Serve(l) }()

	select {
	case err := <-errChan:
		log.Error(err, "agent APIs stopped prematurely")
		return err
	case <-ctx.Done():
		log.Info("stopping agent APIs")
		server.Stop()
		<-errChan
		log.Info("agent APIs have stopped")
		return nil
	}
}
