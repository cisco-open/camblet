// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        (unknown)
// source: v1/agent/trace/trace.proto

package trace

import (
	_ "buf.build/gen/go/bufbuild/protovalidate/protocolbuffers/go/buf/validate"
	core "github.com/cisco-open/camblet/api/v1/core"
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type TraceRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Pid         uint32  `protobuf:"varint,1,opt,name=pid,proto3" json:"pid,omitempty"`
	Uid         *uint32 `protobuf:"varint,2,opt,name=uid,proto3,oneof" json:"uid,omitempty"`
	CommandName string  `protobuf:"bytes,3,opt,name=command_name,json=commandName,proto3" json:"command_name,omitempty"`
}

func (x *TraceRequest) Reset() {
	*x = TraceRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_agent_trace_trace_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *TraceRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*TraceRequest) ProtoMessage() {}

func (x *TraceRequest) ProtoReflect() protoreflect.Message {
	mi := &file_v1_agent_trace_trace_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use TraceRequest.ProtoReflect.Descriptor instead.
func (*TraceRequest) Descriptor() ([]byte, []int) {
	return file_v1_agent_trace_trace_proto_rawDescGZIP(), []int{0}
}

func (x *TraceRequest) GetPid() uint32 {
	if x != nil {
		return x.Pid
	}
	return 0
}

func (x *TraceRequest) GetUid() uint32 {
	if x != nil && x.Uid != nil {
		return *x.Uid
	}
	return 0
}

func (x *TraceRequest) GetCommandName() string {
	if x != nil {
		return x.CommandName
	}
	return ""
}

type TraceResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Context *core.CommandContext `protobuf:"bytes,1,opt,name=context,proto3" json:"context,omitempty"`
	Message string               `protobuf:"bytes,2,opt,name=message,proto3" json:"message,omitempty"`
	Values  map[string]string    `protobuf:"bytes,3,rep,name=values,proto3" json:"values,omitempty" protobuf_key:"bytes,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
}

func (x *TraceResponse) Reset() {
	*x = TraceResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_agent_trace_trace_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *TraceResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*TraceResponse) ProtoMessage() {}

func (x *TraceResponse) ProtoReflect() protoreflect.Message {
	mi := &file_v1_agent_trace_trace_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use TraceResponse.ProtoReflect.Descriptor instead.
func (*TraceResponse) Descriptor() ([]byte, []int) {
	return file_v1_agent_trace_trace_proto_rawDescGZIP(), []int{1}
}

func (x *TraceResponse) GetContext() *core.CommandContext {
	if x != nil {
		return x.Context
	}
	return nil
}

func (x *TraceResponse) GetMessage() string {
	if x != nil {
		return x.Message
	}
	return ""
}

func (x *TraceResponse) GetValues() map[string]string {
	if x != nil {
		return x.Values
	}
	return nil
}

var File_v1_agent_trace_trace_proto protoreflect.FileDescriptor

var file_v1_agent_trace_trace_proto_rawDesc = []byte{
	0x0a, 0x1a, 0x76, 0x31, 0x2f, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x2f, 0x74, 0x72, 0x61, 0x63, 0x65,
	0x2f, 0x74, 0x72, 0x61, 0x63, 0x65, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x1a, 0x63, 0x61,
	0x6d, 0x62, 0x6c, 0x65, 0x74, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x61, 0x67, 0x65,
	0x6e, 0x74, 0x2e, 0x74, 0x72, 0x61, 0x63, 0x65, 0x1a, 0x1b, 0x62, 0x75, 0x66, 0x2f, 0x76, 0x61,
	0x6c, 0x69, 0x64, 0x61, 0x74, 0x65, 0x2f, 0x76, 0x61, 0x6c, 0x69, 0x64, 0x61, 0x74, 0x65, 0x2e,
	0x70, 0x72, 0x6f, 0x74, 0x6f, 0x1a, 0x15, 0x76, 0x31, 0x2f, 0x63, 0x6f, 0x72, 0x65, 0x2f, 0x63,
	0x6f, 0x6e, 0x74, 0x65, 0x78, 0x74, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x22, 0xfd, 0x01, 0x0a,
	0x0c, 0x54, 0x72, 0x61, 0x63, 0x65, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x10, 0x0a,
	0x03, 0x70, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0d, 0x52, 0x03, 0x70, 0x69, 0x64, 0x12,
	0x15, 0x0a, 0x03, 0x75, 0x69, 0x64, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0d, 0x48, 0x00, 0x52, 0x03,
	0x75, 0x69, 0x64, 0x88, 0x01, 0x01, 0x12, 0x21, 0x0a, 0x0c, 0x63, 0x6f, 0x6d, 0x6d, 0x61, 0x6e,
	0x64, 0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0b, 0x63, 0x6f,
	0x6d, 0x6d, 0x61, 0x6e, 0x64, 0x4e, 0x61, 0x6d, 0x65, 0x3a, 0x98, 0x01, 0xba, 0x48, 0x94, 0x01,
	0x1a, 0x91, 0x01, 0x0a, 0x26, 0x70, 0x69, 0x64, 0x5f, 0x6f, 0x72, 0x5f, 0x75, 0x69, 0x64, 0x5f,
	0x6f, 0x72, 0x5f, 0x63, 0x6f, 0x6d, 0x6d, 0x61, 0x6e, 0x64, 0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x5f,
	0x6d, 0x75, 0x73, 0x74, 0x5f, 0x62, 0x65, 0x5f, 0x73, 0x65, 0x74, 0x1a, 0x67, 0x21, 0x68, 0x61,
	0x73, 0x28, 0x74, 0x68, 0x69, 0x73, 0x2e, 0x70, 0x69, 0x64, 0x29, 0x20, 0x26, 0x26, 0x20, 0x21,
	0x68, 0x61, 0x73, 0x28, 0x74, 0x68, 0x69, 0x73, 0x2e, 0x75, 0x69, 0x64, 0x29, 0x20, 0x26, 0x26,
	0x20, 0x21, 0x68, 0x61, 0x73, 0x28, 0x74, 0x68, 0x69, 0x73, 0x2e, 0x63, 0x6f, 0x6d, 0x6d, 0x61,
	0x6e, 0x64, 0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x29, 0x3f, 0x20, 0x27, 0x70, 0x69, 0x64, 0x2c, 0x20,
	0x75, 0x69, 0x64, 0x20, 0x6f, 0x72, 0x20, 0x63, 0x6f, 0x6d, 0x6d, 0x61, 0x6e, 0x64, 0x5f, 0x6e,
	0x61, 0x6d, 0x65, 0x20, 0x6d, 0x75, 0x73, 0x74, 0x20, 0x62, 0x65, 0x20, 0x73, 0x65, 0x74, 0x27,
	0x3a, 0x20, 0x27, 0x27, 0x42, 0x06, 0x0a, 0x04, 0x5f, 0x75, 0x69, 0x64, 0x22, 0xf2, 0x01, 0x0a,
	0x0d, 0x54, 0x72, 0x61, 0x63, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x3d,
	0x0a, 0x07, 0x63, 0x6f, 0x6e, 0x74, 0x65, 0x78, 0x74, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0b, 0x32,
	0x23, 0x2e, 0x63, 0x61, 0x6d, 0x62, 0x6c, 0x65, 0x74, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31,
	0x2e, 0x63, 0x6f, 0x72, 0x65, 0x2e, 0x43, 0x6f, 0x6d, 0x6d, 0x61, 0x6e, 0x64, 0x43, 0x6f, 0x6e,
	0x74, 0x65, 0x78, 0x74, 0x52, 0x07, 0x63, 0x6f, 0x6e, 0x74, 0x65, 0x78, 0x74, 0x12, 0x18, 0x0a,
	0x07, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07,
	0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x12, 0x4d, 0x0a, 0x06, 0x76, 0x61, 0x6c, 0x75, 0x65,
	0x73, 0x18, 0x03, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x35, 0x2e, 0x63, 0x61, 0x6d, 0x62, 0x6c, 0x65,
	0x74, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x2e, 0x74,
	0x72, 0x61, 0x63, 0x65, 0x2e, 0x54, 0x72, 0x61, 0x63, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e,
	0x73, 0x65, 0x2e, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x73, 0x45, 0x6e, 0x74, 0x72, 0x79, 0x52, 0x06,
	0x76, 0x61, 0x6c, 0x75, 0x65, 0x73, 0x1a, 0x39, 0x0a, 0x0b, 0x56, 0x61, 0x6c, 0x75, 0x65, 0x73,
	0x45, 0x6e, 0x74, 0x72, 0x79, 0x12, 0x10, 0x0a, 0x03, 0x6b, 0x65, 0x79, 0x18, 0x01, 0x20, 0x01,
	0x28, 0x09, 0x52, 0x03, 0x6b, 0x65, 0x79, 0x12, 0x14, 0x0a, 0x05, 0x76, 0x61, 0x6c, 0x75, 0x65,
	0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x05, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x3a, 0x02, 0x38,
	0x01, 0x32, 0x68, 0x0a, 0x06, 0x54, 0x72, 0x61, 0x63, 0x65, 0x73, 0x12, 0x5e, 0x0a, 0x05, 0x54,
	0x72, 0x61, 0x63, 0x65, 0x12, 0x28, 0x2e, 0x63, 0x61, 0x6d, 0x62, 0x6c, 0x65, 0x74, 0x2e, 0x61,
	0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x2e, 0x74, 0x72, 0x61, 0x63,
	0x65, 0x2e, 0x54, 0x72, 0x61, 0x63, 0x65, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x29,
	0x2e, 0x63, 0x61, 0x6d, 0x62, 0x6c, 0x65, 0x74, 0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e,
	0x61, 0x67, 0x65, 0x6e, 0x74, 0x2e, 0x74, 0x72, 0x61, 0x63, 0x65, 0x2e, 0x54, 0x72, 0x61, 0x63,
	0x65, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x30, 0x01, 0x42, 0x32, 0x5a, 0x30, 0x67,
	0x69, 0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x63, 0x69, 0x73, 0x63, 0x6f, 0x2d,
	0x6f, 0x70, 0x65, 0x6e, 0x2f, 0x63, 0x61, 0x6d, 0x62, 0x6c, 0x65, 0x74, 0x2f, 0x61, 0x70, 0x69,
	0x2f, 0x76, 0x31, 0x2f, 0x61, 0x67, 0x65, 0x6e, 0x74, 0x2f, 0x74, 0x72, 0x61, 0x63, 0x65, 0x62,
	0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_v1_agent_trace_trace_proto_rawDescOnce sync.Once
	file_v1_agent_trace_trace_proto_rawDescData = file_v1_agent_trace_trace_proto_rawDesc
)

func file_v1_agent_trace_trace_proto_rawDescGZIP() []byte {
	file_v1_agent_trace_trace_proto_rawDescOnce.Do(func() {
		file_v1_agent_trace_trace_proto_rawDescData = protoimpl.X.CompressGZIP(file_v1_agent_trace_trace_proto_rawDescData)
	})
	return file_v1_agent_trace_trace_proto_rawDescData
}

var file_v1_agent_trace_trace_proto_msgTypes = make([]protoimpl.MessageInfo, 3)
var file_v1_agent_trace_trace_proto_goTypes = []interface{}{
	(*TraceRequest)(nil),        // 0: camblet.api.v1.agent.trace.TraceRequest
	(*TraceResponse)(nil),       // 1: camblet.api.v1.agent.trace.TraceResponse
	nil,                         // 2: camblet.api.v1.agent.trace.TraceResponse.ValuesEntry
	(*core.CommandContext)(nil), // 3: camblet.api.v1.core.CommandContext
}
var file_v1_agent_trace_trace_proto_depIdxs = []int32{
	3, // 0: camblet.api.v1.agent.trace.TraceResponse.context:type_name -> camblet.api.v1.core.CommandContext
	2, // 1: camblet.api.v1.agent.trace.TraceResponse.values:type_name -> camblet.api.v1.agent.trace.TraceResponse.ValuesEntry
	0, // 2: camblet.api.v1.agent.trace.Traces.Trace:input_type -> camblet.api.v1.agent.trace.TraceRequest
	1, // 3: camblet.api.v1.agent.trace.Traces.Trace:output_type -> camblet.api.v1.agent.trace.TraceResponse
	3, // [3:4] is the sub-list for method output_type
	2, // [2:3] is the sub-list for method input_type
	2, // [2:2] is the sub-list for extension type_name
	2, // [2:2] is the sub-list for extension extendee
	0, // [0:2] is the sub-list for field type_name
}

func init() { file_v1_agent_trace_trace_proto_init() }
func file_v1_agent_trace_trace_proto_init() {
	if File_v1_agent_trace_trace_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_v1_agent_trace_trace_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*TraceRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_v1_agent_trace_trace_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*TraceResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	file_v1_agent_trace_trace_proto_msgTypes[0].OneofWrappers = []interface{}{}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_v1_agent_trace_trace_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   3,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_v1_agent_trace_trace_proto_goTypes,
		DependencyIndexes: file_v1_agent_trace_trace_proto_depIdxs,
		MessageInfos:      file_v1_agent_trace_trace_proto_msgTypes,
	}.Build()
	File_v1_agent_trace_trace_proto = out.File
	file_v1_agent_trace_trace_proto_rawDesc = nil
	file_v1_agent_trace_trace_proto_goTypes = nil
	file_v1_agent_trace_trace_proto_depIdxs = nil
}
