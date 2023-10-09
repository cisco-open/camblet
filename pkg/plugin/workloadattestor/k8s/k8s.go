package k8s

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"

	"emperror.dev/errors"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	corev1 "k8s.io/api/core/v1"

	"github.com/cisco-open/nasp/api/types"
	"github.com/cisco-open/nasp/pkg/plugin"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor"
	"github.com/cisco-open/nasp/pkg/plugin/workloadattestor/docker"
	"github.com/cisco-open/nasp/pkg/util"
)

const (
	attestorName = "k8s"
)

type UID string

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
	cgroups, err := docker.GetCgroups(pid)
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}

	if err != nil {
		return nil, errors.WrapIf(err, "could not get cgroup")
	}

	podUID, containerID := getPodUIDAndContainerIDFromCGroups(cgroups)
	if containerID == "" {
		return nil, nil
	}

	kubeletClient, err := a.getKubeletClient()
	if err != nil {
		return nil, errors.WrapIf(err, "could not get kubelet client")
	}

	j, err := kubeletClient.GetPodList()
	if err != nil {
		return nil, errors.WrapIf(err, "could not get pod list from kubelet")
	}

	podList := new(corev1.PodList)
	if err := json.Unmarshal(j, &podList); err != nil {
		return nil, status.Errorf(codes.Internal, "unable to decode pod info from kubelet response: %v", err)
	}

	tags := workloadattestor.InitTagsWithPrefix("k8s")

	pod, container, containerStatus := a.getPodAndContainer(podUID, containerID, podList.Items)
	if pod.GetName() == "" {
		return tags.Tags, nil
	}

	tags.Add("pod:name", pod.GetName())
	tags.Add("pod:namespace", pod.GetNamespace())
	tags.Add("pod:serviceaccount:name", pod.Spec.ServiceAccountName)
	for _, cs := range pod.Status.ContainerStatuses {
		tags.Add("pod:image:id", cs.ImageID)
	}

	imageCount := 0
	for _, c := range pod.Spec.Containers {
		imageCount++
		tags.Add("pod:image:name", c.Image)
	}
	tags.Add("pod:image:count", fmt.Sprintf("%d", imageCount))

	imageCount = 0
	for _, c := range pod.Spec.InitContainers {
		imageCount++
		tags.Add("pod:init-image:name", c.Image)
	}
	tags.Add("pod:init-image:count", fmt.Sprintf("%d", imageCount))

	imageCount = 0
	for _, c := range pod.Spec.EphemeralContainers {
		imageCount++
		tags.Add("pod:ephemeral-image:name", c.Image)
	}
	tags.Add("pod:ephemeral-image:count", fmt.Sprintf("%d", imageCount))

	for _, owner := range pod.GetOwnerReferences() {
		tags.Add("pod:owner:kind", strings.ToLower(owner.Kind))
		tags.Add("pod:owner:kind-with-version", strings.ToLower(owner.APIVersion)+"/"+strings.ToLower(owner.Kind))
	}

	tags.Add("node:name", pod.Spec.NodeName)
	for k, v := range pod.GetLabels() {
		tags.Add(fmt.Sprintf("pod:label:%s", k), v)
	}
	for k, v := range pod.GetAnnotations() {
		tags.Add(fmt.Sprintf("pod:annotation:%s", k), v)
	}

	if container.Name != "" {
		tags.Add("container:name", container.Name)
		tags.Add("container:image:id", containerStatus.ImageID)
	}

	return tags.Tags, nil
}

func (a *attestor) getPodAndContainer(podUID, containerID string, pods []corev1.Pod) (pod corev1.Pod, container corev1.Container, containerStatus corev1.ContainerStatus) {
	for _, _pod := range pods {
		if string(_pod.GetUID()) == podUID {
			pod = _pod
			break
		}
	}

	for _, c := range pod.Status.ContainerStatuses {
		if strings.Contains(c.ContainerID, containerID) {
			containerStatus = c
			break
		}
	}

	for _, c := range pod.Spec.Containers {
		if c.Name == containerStatus.Name {
			container = c
			break
		}
	}

	if container.Name == "" {
		for _, c := range pod.Spec.EphemeralContainers {
			if c.Name == containerStatus.Name {
				container = corev1.Container(c.EphemeralContainerCommon)
				break
			}
		}
	}

	return pod, container, containerStatus
}

func (a *attestor) getTLSConfig(creds Credentials) (*tls.Config, error) {
	tlsConfig := &tls.Config{
		InsecureSkipVerify: util.PointerToBool(a.config.SkipKubeletVerification),
	}

	if certPool, err := a.config.GetX509CertPool(); err != nil {
		return nil, errors.WrapIf(err, "could not get x509 cert pool")
	} else {
		tlsConfig.RootCAs = certPool
	}

	if creds.CredentialType == X509CredentialType && creds.Certificate.Certificate != nil {
		tlsConfig.Certificates = append(tlsConfig.Certificates, creds.Certificate)
	}

	return tlsConfig, nil
}

func (a *attestor) getKubeletClient() (*kubeletClient, error) {
	cred, err := a.config.GetCredentials()
	if err != nil {
		return nil, errors.WrapIf(err, "could not get credentials")
	}

	tlsConfig, err := a.getTLSConfig(cred)
	if err != nil {
		return nil, errors.WrapIf(err, "could not get tls config")
	}

	return &kubeletClient{
		Transport: &http.Transport{
			TLSClientConfig: tlsConfig,
		},
		URL: url.URL{
			Scheme: "https",
			Host:   fmt.Sprintf("%s:%d", a.config.KubeletHost, a.config.KubeletPort),
		},
		Token: cred.Token,
	}, nil
}