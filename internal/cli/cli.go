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

package cli

import (
	"context"
	"fmt"
	"os"

	"emperror.dev/errors"
	"github.com/AlecAivazis/survey/v2"
	"github.com/go-logr/logr"
	"github.com/iand/logfmtr"
	"github.com/mattn/go-isatty"
	"github.com/spf13/viper"
	"github.com/werbenhu/eventbus"
	"k8s.io/klog/v2"

	"github.com/cisco-open/nasp/pkg/config"
)

type CLI interface {
	Name() string
	BuildInfo() BuildInfo
	Color() bool
	Interactive() bool

	Viper() *viper.Viper
	EventBus() *eventbus.EventBus

	Logger() logr.Logger

	SetConfiguration(configuration config.Config)
	Configuration() config.Config

	IfConfirmed(message string, defaultOption bool, action func() error) error
	Confirm(message string, defaultOption bool) (bool, error)
	Input(message string, defaultValue string, opts ...survey.AskOpt) (string, error)
	InputPassword(message string, opts ...survey.AskOpt) (string, error)
}

type BuildInfo struct {
	Version    string
	CommitHash string
	BuildDate  string
}

func (i BuildInfo) String() string {
	return fmt.Sprintf("version %s (%s) built on %s\n", i.Version, i.CommitHash, i.BuildDate)
}

type cli struct {
	name      string
	buildInfo BuildInfo

	logger   logr.Logger
	viper    *viper.Viper
	eventBus *eventbus.EventBus

	configuration config.Config
}

type contextValue struct{}

func ContextWithCLI(ctx context.Context, cli CLI) context.Context {
	return context.WithValue(ctx, &contextValue{}, cli)
}

func FromContext(ctx context.Context) CLI {
	if c, ok := ctx.Value(&contextValue{}).(CLI); ok {
		return c
	}

	return nil
}

func LoggerFromContext(ctx context.Context) logr.Logger {
	cli := FromContext(ctx)
	if cli == nil {
		return klog.Background()
	}

	return cli.Logger()
}

func NewCLI(name string, buildInfo BuildInfo) CLI {
	return &cli{
		name:      name,
		buildInfo: buildInfo,
		viper:     viper.New(),
		eventBus:  eventbus.New(),
	}
}

func (c *cli) Name() string {
	return c.name
}

func (c *cli) BuildInfo() BuildInfo {
	return c.buildInfo
}

func (c *cli) SetConfiguration(configuration config.Config) {
	c.configuration = configuration
}

func (c *cli) Configuration() config.Config {
	return c.configuration
}

func (c *cli) Viper() *viper.Viper {
	return c.viper
}

func (c *cli) EventBus() *eventbus.EventBus {
	return c.eventBus
}

func (c *cli) Logger() logr.Logger {
	if c.logger == (logr.Logger{}) {
		c.logger = c.createLogger()
	}

	return c.logger
}

func (c *cli) createLogger() logr.Logger {
	opts := logfmtr.DefaultOptions()
	opts.AddCaller = true
	opts.Colorize = c.Color()
	opts.Humanize = c.Interactive()
	opts.CallerSkip = 2

	return logfmtr.NewWithOptions(opts)
}

func (c *cli) Interactive() bool {
	if isatty.IsTerminal(os.Stdout.Fd()) && isatty.IsTerminal(os.Stdin.Fd()) {
		return !c.viper.GetBool("non-interactive")
	}

	return c.viper.GetBool("force-interactive")
}

func (c *cli) Color() bool {
	if isatty.IsTerminal(os.Stdout.Fd()) {
		return !c.viper.GetBool("no-color")
	}

	return c.viper.GetBool("force-color")
}

func (c *cli) Confirm(message string, defaultOption bool) (bool, error) {
	confirmed := defaultOption
	if c.Interactive() {
		err := survey.AskOne(&survey.Confirm{
			Renderer: survey.Renderer{},
			Message:  message,
			Default:  defaultOption,
		}, &confirmed)
		if err != nil {
			return false, errors.Wrapf(err, "failed to get confirmation")
		}
	}
	return confirmed, nil
}

func (c *cli) IfConfirmed(message string, defaultOption bool, action func() error) error {
	confirmed, err := c.Confirm(message, defaultOption)
	if err != nil {
		return err
	}
	if confirmed {
		return action()
	}
	return nil
}

func (c *cli) Input(message string, defaultValue string, opts ...survey.AskOpt) (string, error) {
	userInput := defaultValue
	if c.Interactive() {
		err := survey.AskOne(&survey.Input{
			Message: message,
			Default: defaultValue,
		}, &userInput, opts...)
		if err != nil {
			return "", errors.Wrapf(err, "failed getting user input")
		}
	}

	return userInput, nil
}

func (c *cli) InputPassword(message string, opts ...survey.AskOpt) (string, error) {
	userInput := ""
	if c.Interactive() {
		err := survey.AskOne(&survey.Password{
			Message: message,
		}, &userInput, opts...)
		if err != nil {
			return "", errors.Wrapf(err, "failed getting user password")
		}
	}

	return userInput, nil
}
