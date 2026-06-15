import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive/hive.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@HiveType(typeId: 10)
@freezed
class UserProfile with _$UserProfile {
  const factory UserProfile({
    @HiveField(0) required String id,
    @HiveField(1) required String username,
    @HiveField(2) String? email,
    @HiveField(3) String? role,
    @HiveField(4) String? avatarUrl,
    @HiveField(5) @Default(0.0) double currentBankroll,
    @HiveField(6) @Default(0.0) double totalProfit,
    @HiveField(7) @Default(0) int wins,
    @HiveField(8) @Default(0) int losses,
    @HiveField(9) @Default(0) int pushes,
  }) = _UserProfile;

  factory UserProfile.fromJson(Map<String, dynamic> json) =>
      _$UserProfileFromJson(json);
}
