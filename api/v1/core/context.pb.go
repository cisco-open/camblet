// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.32.0
// 	protoc        (unknown)
// source: v1/core/context.proto

package core

import (
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

type CommandContext struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Pid         uint32 `protobuf:"varint,1,opt,name=pid,proto3" json:"pid,omitempty"`
	Uid         uint32 `protobuf:"varint,2,opt,name=uid,proto3" json:"uid,omitempty"`
	Gid         uint32 `protobuf:"varint,3,opt,name=gid,proto3" json:"gid,omitempty"`
	CommandName string `protobuf:"bytes,4,opt,name=command_name,json=commandName,proto3" json:"command_name,omitempty"`
	CommandPath string `protobuf:"bytes,5,opt,name=command_path,json=commandPath,proto3" json:"command_path,omitempty"`
	CgroupPath  string `protobuf:"bytes,6,opt,name=cgroup_path,json=cgroupPath,proto3" json:"cgroup_path,omitempty"`
}

func (x *CommandContext) Reset() {
	*x = CommandContext{}
	if protoimpl.UnsafeEnabled {
		mi := &file_v1_core_context_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *CommandContext) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*CommandContext) ProtoMessage() {}

func (x *CommandContext) ProtoReflect() protoreflect.Message {
	mi := &file_v1_core_context_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use CommandContext.ProtoReflect.Descriptor instead.
func (*CommandContext) Descriptor() ([]byte, []int) {
	return file_v1_core_context_proto_rawDescGZIP(), []int{0}
}

func (x *CommandContext) GetPid() uint32 {
	if x != nil {
		return x.Pid
	}
	return 0
}

func (x *CommandContext) GetUid() uint32 {
	if x != nil {
		return x.Uid
	}
	return 0
}

func (x *CommandContext) GetGid() uint32 {
	if x != nil {
		return x.Gid
	}
	return 0
}

func (x *CommandContext) GetCommandName() string {
	if x != nil {
		return x.CommandName
	}
	return ""
}

func (x *CommandContext) GetCommandPath() string {
	if x != nil {
		return x.CommandPath
	}
	return ""
}

func (x *CommandContext) GetCgroupPath() string {
	if x != nil {
		return x.CgroupPath
	}
	return ""
}

var File_v1_core_context_proto protoreflect.FileDescriptor

var file_v1_core_context_proto_rawDesc = []byte{
	0x0a, 0x15, 0x76, 0x31, 0x2f, 0x63, 0x6f, 0x72, 0x65, 0x2f, 0x63, 0x6f, 0x6e, 0x74, 0x65, 0x78,
	0x74, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12, 0x13, 0x63, 0x61, 0x6d, 0x62, 0x6c, 0x65, 0x74,
	0x2e, 0x61, 0x70, 0x69, 0x2e, 0x76, 0x31, 0x2e, 0x63, 0x6f, 0x72, 0x65, 0x22, 0xad, 0x01, 0x0a,
	0x0e, 0x43, 0x6f, 0x6d, 0x6d, 0x61, 0x6e, 0x64, 0x43, 0x6f, 0x6e, 0x74, 0x65, 0x78, 0x74, 0x12,
	0x10, 0x0a, 0x03, 0x70, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x0d, 0x52, 0x03, 0x70, 0x69,
	0x64, 0x12, 0x10, 0x0a, 0x03, 0x75, 0x69, 0x64, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0d, 0x52, 0x03,
	0x75, 0x69, 0x64, 0x12, 0x10, 0x0a, 0x03, 0x67, 0x69, 0x64, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0d,
	0x52, 0x03, 0x67, 0x69, 0x64, 0x12, 0x21, 0x0a, 0x0c, 0x63, 0x6f, 0x6d, 0x6d, 0x61, 0x6e, 0x64,
	0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x04, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0b, 0x63, 0x6f, 0x6d,
	0x6d, 0x61, 0x6e, 0x64, 0x4e, 0x61, 0x6d, 0x65, 0x12, 0x21, 0x0a, 0x0c, 0x63, 0x6f, 0x6d, 0x6d,
	0x61, 0x6e, 0x64, 0x5f, 0x70, 0x61, 0x74, 0x68, 0x18, 0x05, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0b,
	0x63, 0x6f, 0x6d, 0x6d, 0x61, 0x6e, 0x64, 0x50, 0x61, 0x74, 0x68, 0x12, 0x1f, 0x0a, 0x0b, 0x63,
	0x67, 0x72, 0x6f, 0x75, 0x70, 0x5f, 0x70, 0x61, 0x74, 0x68, 0x18, 0x06, 0x20, 0x01, 0x28, 0x09,
	0x52, 0x0a, 0x63, 0x67, 0x72, 0x6f, 0x75, 0x70, 0x50, 0x61, 0x74, 0x68, 0x42, 0x2b, 0x5a, 0x29,
	0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x63, 0x69, 0x73, 0x63, 0x6f,
	0x2d, 0x6f, 0x70, 0x65, 0x6e, 0x2f, 0x63, 0x61, 0x6d, 0x62, 0x6c, 0x65, 0x74, 0x2f, 0x61, 0x70,
	0x69, 0x2f, 0x76, 0x31, 0x2f, 0x63, 0x6f, 0x72, 0x65, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f,
	0x33,
}

var (
	file_v1_core_context_proto_rawDescOnce sync.Once
	file_v1_core_context_proto_rawDescData = file_v1_core_context_proto_rawDesc
)

func file_v1_core_context_proto_rawDescGZIP() []byte {
	file_v1_core_context_proto_rawDescOnce.Do(func() {
		file_v1_core_context_proto_rawDescData = protoimpl.X.CompressGZIP(file_v1_core_context_proto_rawDescData)
	})
	return file_v1_core_context_proto_rawDescData
}

var file_v1_core_context_proto_msgTypes = make([]protoimpl.MessageInfo, 1)
var file_v1_core_context_proto_goTypes = []interface{}{
	(*CommandContext)(nil), // 0: camblet.api.v1.core.CommandContext
}
var file_v1_core_context_proto_depIdxs = []int32{
	0, // [0:0] is the sub-list for method output_type
	0, // [0:0] is the sub-list for method input_type
	0, // [0:0] is the sub-list for extension type_name
	0, // [0:0] is the sub-list for extension extendee
	0, // [0:0] is the sub-list for field type_name
}

func init() { file_v1_core_context_proto_init() }
func file_v1_core_context_proto_init() {
	if File_v1_core_context_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_v1_core_context_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*CommandContext); i {
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
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_v1_core_context_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   1,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_v1_core_context_proto_goTypes,
		DependencyIndexes: file_v1_core_context_proto_depIdxs,
		MessageInfos:      file_v1_core_context_proto_msgTypes,
	}.Build()
	File_v1_core_context_proto = out.File
	file_v1_core_context_proto_rawDesc = nil
	file_v1_core_context_proto_goTypes = nil
	file_v1_core_context_proto_depIdxs = nil
}
