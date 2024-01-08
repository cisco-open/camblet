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

package service

import (
	"context"
	"encoding/json"

	"github.com/go-logr/logr"
	"google.golang.org/protobuf/encoding/protojson"
	"sigs.k8s.io/yaml"

	"github.com/cisco-open/nasp/pkg/util"
)

type FileLoaderOption func(*fileLoader)

type FileLoader interface {
	Run(context.Context, HandlerFunc) error
}

type fileLoader struct {
	fileContentLoader util.FileContentLoader
	logger            logr.Logger
	validatorFunc     ProtoValidatorFunc
	withTags          map[string]struct{}
}

func FileLoaderWithProtoValidatorFunc(fn ProtoValidatorFunc) FileLoaderOption {
	return func(l *fileLoader) {
		l.validatorFunc = fn
	}
}

func FileLoaderWithTags(tags []string) FileLoaderOption {
	return func(l *fileLoader) {
		l.withTags = map[string]struct{}{}
		for _, tag := range tags {
			l.withTags[tag] = struct{}{}
		}
	}
}

func FileLoadWithLogger(logger logr.Logger) FileLoaderOption {
	return func(l *fileLoader) {
		l.logger = logger.WithName("sdFileLoader")
	}
}

func NewFileLoader(paths []string, opts ...FileLoaderOption) FileLoader {
	fl := &fileLoader{}

	for _, f := range opts {
		f(fl)
	}

	if fl.logger == (logr.Logger{}) {
		fl.logger = logr.Discard()
	}

	if fl.fileContentLoader == nil {
		fl.fileContentLoader = util.NewFileContentLoader(paths, fl.logger)
	}

	return fl
}

func (l *fileLoader) Run(ctx context.Context, h HandlerFunc) error {
	return l.fileContentLoader.Run(ctx, func(contents map[string][]byte) {
		services := make(Services, 0)

		for file, content := range contents {
			if e, err := l.unmarshal(content); err != nil {
				l.logger.Error(err, "error during parsing service discovery file ", "path", file)
				continue
			} else {
				MergeEntries(services, e)
			}
		}

		h(services)
	})
}

func (l *fileLoader) unmarshal(content []byte) (Services, error) {
	var raw []any
	if err := yaml.Unmarshal(content, &raw); err != nil {
		return nil, err
	}

	services := RawServices{}
	for _, item := range raw {
		entryJSON, err := json.Marshal(item)
		if err != nil {
			l.logger.Error(err, "could not marshal service discovery entry to json")
			continue
		}

		var service RawService
		if err := protojson.Unmarshal(entryJSON, &service); err != nil {
			l.logger.Error(err, "could not unmarshal json service discovery entry to proto")
			continue
		}

		if l.validatorFunc != nil {
			if err := l.validatorFunc(&service); err != nil {
				l.logger.Error(err, "invalid service discovery entry")
				continue
			}
		}

		services = append(services, &service)
	}

	return ConvertEntries(services, l.withTags), nil
}
