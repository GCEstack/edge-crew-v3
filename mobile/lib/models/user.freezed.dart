// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'user.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

UserProfile _$UserProfileFromJson(Map<String, dynamic> json) {
  return _UserProfile.fromJson(json);
}

/// @nodoc
mixin _$UserProfile {
  @HiveField(0)
  String get id => throw _privateConstructorUsedError;
  @HiveField(1)
  String get username => throw _privateConstructorUsedError;
  @HiveField(2)
  String? get email => throw _privateConstructorUsedError;
  @HiveField(3)
  String? get role => throw _privateConstructorUsedError;
  @HiveField(4)
  String? get avatarUrl => throw _privateConstructorUsedError;
  @HiveField(5)
  double get currentBankroll => throw _privateConstructorUsedError;
  @HiveField(6)
  double get totalProfit => throw _privateConstructorUsedError;
  @HiveField(7)
  int get wins => throw _privateConstructorUsedError;
  @HiveField(8)
  int get losses => throw _privateConstructorUsedError;
  @HiveField(9)
  int get pushes => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $UserProfileCopyWith<UserProfile> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $UserProfileCopyWith<$Res> {
  factory $UserProfileCopyWith(
          UserProfile value, $Res Function(UserProfile) then) =
      _$UserProfileCopyWithImpl<$Res, UserProfile>;
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String username,
      @HiveField(2) String? email,
      @HiveField(3) String? role,
      @HiveField(4) String? avatarUrl,
      @HiveField(5) double currentBankroll,
      @HiveField(6) double totalProfit,
      @HiveField(7) int wins,
      @HiveField(8) int losses,
      @HiveField(9) int pushes});
}

/// @nodoc
class _$UserProfileCopyWithImpl<$Res, $Val extends UserProfile>
    implements $UserProfileCopyWith<$Res> {
  _$UserProfileCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? username = null,
    Object? email = freezed,
    Object? role = freezed,
    Object? avatarUrl = freezed,
    Object? currentBankroll = null,
    Object? totalProfit = null,
    Object? wins = null,
    Object? losses = null,
    Object? pushes = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      username: null == username
          ? _value.username
          : username // ignore: cast_nullable_to_non_nullable
              as String,
      email: freezed == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String?,
      role: freezed == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String?,
      avatarUrl: freezed == avatarUrl
          ? _value.avatarUrl
          : avatarUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      currentBankroll: null == currentBankroll
          ? _value.currentBankroll
          : currentBankroll // ignore: cast_nullable_to_non_nullable
              as double,
      totalProfit: null == totalProfit
          ? _value.totalProfit
          : totalProfit // ignore: cast_nullable_to_non_nullable
              as double,
      wins: null == wins
          ? _value.wins
          : wins // ignore: cast_nullable_to_non_nullable
              as int,
      losses: null == losses
          ? _value.losses
          : losses // ignore: cast_nullable_to_non_nullable
              as int,
      pushes: null == pushes
          ? _value.pushes
          : pushes // ignore: cast_nullable_to_non_nullable
              as int,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$UserProfileImplCopyWith<$Res>
    implements $UserProfileCopyWith<$Res> {
  factory _$$UserProfileImplCopyWith(
          _$UserProfileImpl value, $Res Function(_$UserProfileImpl) then) =
      __$$UserProfileImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String username,
      @HiveField(2) String? email,
      @HiveField(3) String? role,
      @HiveField(4) String? avatarUrl,
      @HiveField(5) double currentBankroll,
      @HiveField(6) double totalProfit,
      @HiveField(7) int wins,
      @HiveField(8) int losses,
      @HiveField(9) int pushes});
}

/// @nodoc
class __$$UserProfileImplCopyWithImpl<$Res>
    extends _$UserProfileCopyWithImpl<$Res, _$UserProfileImpl>
    implements _$$UserProfileImplCopyWith<$Res> {
  __$$UserProfileImplCopyWithImpl(
      _$UserProfileImpl _value, $Res Function(_$UserProfileImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? username = null,
    Object? email = freezed,
    Object? role = freezed,
    Object? avatarUrl = freezed,
    Object? currentBankroll = null,
    Object? totalProfit = null,
    Object? wins = null,
    Object? losses = null,
    Object? pushes = null,
  }) {
    return _then(_$UserProfileImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      username: null == username
          ? _value.username
          : username // ignore: cast_nullable_to_non_nullable
              as String,
      email: freezed == email
          ? _value.email
          : email // ignore: cast_nullable_to_non_nullable
              as String?,
      role: freezed == role
          ? _value.role
          : role // ignore: cast_nullable_to_non_nullable
              as String?,
      avatarUrl: freezed == avatarUrl
          ? _value.avatarUrl
          : avatarUrl // ignore: cast_nullable_to_non_nullable
              as String?,
      currentBankroll: null == currentBankroll
          ? _value.currentBankroll
          : currentBankroll // ignore: cast_nullable_to_non_nullable
              as double,
      totalProfit: null == totalProfit
          ? _value.totalProfit
          : totalProfit // ignore: cast_nullable_to_non_nullable
              as double,
      wins: null == wins
          ? _value.wins
          : wins // ignore: cast_nullable_to_non_nullable
              as int,
      losses: null == losses
          ? _value.losses
          : losses // ignore: cast_nullable_to_non_nullable
              as int,
      pushes: null == pushes
          ? _value.pushes
          : pushes // ignore: cast_nullable_to_non_nullable
              as int,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$UserProfileImpl implements _UserProfile {
  const _$UserProfileImpl(
      {@HiveField(0) required this.id,
      @HiveField(1) required this.username,
      @HiveField(2) this.email,
      @HiveField(3) this.role,
      @HiveField(4) this.avatarUrl,
      @HiveField(5) this.currentBankroll = 0.0,
      @HiveField(6) this.totalProfit = 0.0,
      @HiveField(7) this.wins = 0,
      @HiveField(8) this.losses = 0,
      @HiveField(9) this.pushes = 0});

  factory _$UserProfileImpl.fromJson(Map<String, dynamic> json) =>
      _$$UserProfileImplFromJson(json);

  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String username;
  @override
  @HiveField(2)
  final String? email;
  @override
  @HiveField(3)
  final String? role;
  @override
  @HiveField(4)
  final String? avatarUrl;
  @override
  @JsonKey()
  @HiveField(5)
  final double currentBankroll;
  @override
  @JsonKey()
  @HiveField(6)
  final double totalProfit;
  @override
  @JsonKey()
  @HiveField(7)
  final int wins;
  @override
  @JsonKey()
  @HiveField(8)
  final int losses;
  @override
  @JsonKey()
  @HiveField(9)
  final int pushes;

  @override
  String toString() {
    return 'UserProfile(id: $id, username: $username, email: $email, role: $role, avatarUrl: $avatarUrl, currentBankroll: $currentBankroll, totalProfit: $totalProfit, wins: $wins, losses: $losses, pushes: $pushes)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$UserProfileImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.username, username) ||
                other.username == username) &&
            (identical(other.email, email) || other.email == email) &&
            (identical(other.role, role) || other.role == role) &&
            (identical(other.avatarUrl, avatarUrl) ||
                other.avatarUrl == avatarUrl) &&
            (identical(other.currentBankroll, currentBankroll) ||
                other.currentBankroll == currentBankroll) &&
            (identical(other.totalProfit, totalProfit) ||
                other.totalProfit == totalProfit) &&
            (identical(other.wins, wins) || other.wins == wins) &&
            (identical(other.losses, losses) || other.losses == losses) &&
            (identical(other.pushes, pushes) || other.pushes == pushes));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, username, email, role,
      avatarUrl, currentBankroll, totalProfit, wins, losses, pushes);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$UserProfileImplCopyWith<_$UserProfileImpl> get copyWith =>
      __$$UserProfileImplCopyWithImpl<_$UserProfileImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$UserProfileImplToJson(
      this,
    );
  }
}

abstract class _UserProfile implements UserProfile {
  const factory _UserProfile(
      {@HiveField(0) required final String id,
      @HiveField(1) required final String username,
      @HiveField(2) final String? email,
      @HiveField(3) final String? role,
      @HiveField(4) final String? avatarUrl,
      @HiveField(5) final double currentBankroll,
      @HiveField(6) final double totalProfit,
      @HiveField(7) final int wins,
      @HiveField(8) final int losses,
      @HiveField(9) final int pushes}) = _$UserProfileImpl;

  factory _UserProfile.fromJson(Map<String, dynamic> json) =
      _$UserProfileImpl.fromJson;

  @override
  @HiveField(0)
  String get id;
  @override
  @HiveField(1)
  String get username;
  @override
  @HiveField(2)
  String? get email;
  @override
  @HiveField(3)
  String? get role;
  @override
  @HiveField(4)
  String? get avatarUrl;
  @override
  @HiveField(5)
  double get currentBankroll;
  @override
  @HiveField(6)
  double get totalProfit;
  @override
  @HiveField(7)
  int get wins;
  @override
  @HiveField(8)
  int get losses;
  @override
  @HiveField(9)
  int get pushes;
  @override
  @JsonKey(ignore: true)
  _$$UserProfileImplCopyWith<_$UserProfileImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
