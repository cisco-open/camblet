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

package util

import (
	"context"
	"os"
	"path/filepath"
	"sync"

	"emperror.dev/errors"
	"github.com/go-logr/logr"
	"gopkg.in/fsnotify.v1"
)

type FileContentLoader interface {
	Run(ctx context.Context, h FileContentLoadedFunc) error
}

type fileContentLoader struct {
	paths  []string
	logger logr.Logger

	mu sync.Mutex
}

type FileContentLoadedFunc func(map[string][]byte)

func NewFileContentLoader(paths []string, logger logr.Logger) FileContentLoader {
	return &fileContentLoader{
		paths:  paths,
		logger: logger.WithValues("paths", paths),

		mu: sync.Mutex{},
	}
}

func (r *fileContentLoader) Run(ctx context.Context, h FileContentLoadedFunc) error {
	if err := r.load(h); err != nil {
		return err
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return errors.WrapIf(err, "could not get fsnotify watcher")
	}
	defer watcher.Close()

	for _, path := range r.paths {
		if _, err := os.Lstat(path); err != nil {
			return errors.WrapIf(err, "could not get file info")
		}
		if err := watcher.Add(path); err != nil {
			return errors.WrapIf(err, "could not add path to watcher")
		}
	}

	r.logger.Info("start watching paths for changes")

	for {
		select {
		case <-ctx.Done():
			r.logger.Info("watcher stopped")
			return nil
		case <-watcher.Events:
			if err := r.load(h); err != nil {
				r.logger.Error(err, "could not load")
			}
		case err := <-watcher.Errors:
			if err != nil {
				r.logger.Error(err, "could not watch")
			}
		}
	}
}

func (r *fileContentLoader) load(handler FileContentLoadedFunc) error {
	r.logger.Info("loading files from paths")

	r.mu.Lock()
	defer r.mu.Unlock()

	files := make([]string, 0)
	for _, path := range r.paths {
		info, err := os.Lstat(path)
		if err != nil {
			return errors.WrapIf(err, "could not get file info")
		}
		if info.IsDir() {
			dirInfo, err := os.ReadDir(path)
			if err != nil {
				return errors.WrapIf(err, "could not read directory")
			}

			for _, entry := range dirInfo {
				if entry.IsDir() {
					continue
				}
				files = append(files, filepath.Join(path, entry.Name()))
			}
		} else {
			files = append(files, path)
		}
	}

	contents := make(map[string][]byte)
	for _, file := range files {
		content, err := os.ReadFile(file)
		if err != nil {
			return errors.WrapIf(err, "could not read file")
		}

		contents[file] = content
	}

	handler(contents)

	return nil
}
