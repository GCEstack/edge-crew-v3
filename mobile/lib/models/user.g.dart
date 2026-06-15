// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class UserProfileAdapter extends TypeAdapter<UserProfile> {
  @override
  final int typeId = 10;

  @override
  UserProfile read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return UserProfile(
      id: fields[0] as String,
      username: fields[1] as String,
      email: fields[2] as String?,
      role: fields[3] as String?,
      avatarUrl: fields[4] as String?,
      currentBankroll: fields[5] as double,
      totalProfit: fields[6] as double,
      wins: fields[7] as int,
      losses: fields[8] as int,
      pushes: fields[9] as int,
    );
  }

  @override
  void write(BinaryWriter writer, UserProfile obj) {
    writer
      ..writeByte(10)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.username)
      ..writeByte(2)
      ..write(obj.email)
      ..writeByte(3)
      ..write(obj.role)
      ..writeByte(4)
      ..write(obj.avatarUrl)
      ..writeByte(5)
      ..write(obj.currentBankroll)
      ..writeByte(6)
      ..write(obj.totalProfit)
      ..writeByte(7)
      ..write(obj.wins)
      ..writeByte(8)
      ..write(obj.losses)
      ..writeByte(9)
      ..write(obj.pushes);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserProfileAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$UserProfileImpl _$$UserProfileImplFromJson(Map<String, dynamic> json) =>
    _$UserProfileImpl(
      id: json['id'] as String,
      username: json['username'] as String,
      email: json['email'] as String?,
      role: json['role'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      currentBankroll: (json['currentBankroll'] as num?)?.toDouble() ?? 0.0,
      totalProfit: (json['totalProfit'] as num?)?.toDouble() ?? 0.0,
      wins: (json['wins'] as num?)?.toInt() ?? 0,
      losses: (json['losses'] as num?)?.toInt() ?? 0,
      pushes: (json['pushes'] as num?)?.toInt() ?? 0,
    );

Map<String, dynamic> _$$UserProfileImplToJson(_$UserProfileImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'username': instance.username,
      'email': instance.email,
      'role': instance.role,
      'avatarUrl': instance.avatarUrl,
      'currentBankroll': instance.currentBankroll,
      'totalProfit': instance.totalProfit,
      'wins': instance.wins,
      'losses': instance.losses,
      'pushes': instance.pushes,
    };
