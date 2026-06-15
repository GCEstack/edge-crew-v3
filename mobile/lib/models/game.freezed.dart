// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'game.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Game _$GameFromJson(Map<String, dynamic> json) {
  return _Game.fromJson(json);
}

/// @nodoc
mixin _$Game {
  @HiveField(0)
  String get id => throw _privateConstructorUsedError;
  @HiveField(1)
  String get sport => throw _privateConstructorUsedError;
  @HiveField(2)
  String get homeTeam => throw _privateConstructorUsedError;
  @HiveField(3)
  String get awayTeam => throw _privateConstructorUsedError;
  @HiveField(4)
  DateTime get scheduledAt => throw _privateConstructorUsedError;
  @HiveField(5)
  String? get status => throw _privateConstructorUsedError;
  @HiveField(6)
  Convergence? get convergence => throw _privateConstructorUsedError;
  @HiveField(7)
  Grade? get ourProcess => throw _privateConstructorUsedError;
  @HiveField(8)
  Grade? get aiProcess => throw _privateConstructorUsedError;
  @HiveField(9)
  Pick? get pick => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $GameCopyWith<Game> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GameCopyWith<$Res> {
  factory $GameCopyWith(Game value, $Res Function(Game) then) =
      _$GameCopyWithImpl<$Res, Game>;
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String sport,
      @HiveField(2) String homeTeam,
      @HiveField(3) String awayTeam,
      @HiveField(4) DateTime scheduledAt,
      @HiveField(5) String? status,
      @HiveField(6) Convergence? convergence,
      @HiveField(7) Grade? ourProcess,
      @HiveField(8) Grade? aiProcess,
      @HiveField(9) Pick? pick});

  $ConvergenceCopyWith<$Res>? get convergence;
  $GradeCopyWith<$Res>? get ourProcess;
  $GradeCopyWith<$Res>? get aiProcess;
  $PickCopyWith<$Res>? get pick;
}

/// @nodoc
class _$GameCopyWithImpl<$Res, $Val extends Game>
    implements $GameCopyWith<$Res> {
  _$GameCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? sport = null,
    Object? homeTeam = null,
    Object? awayTeam = null,
    Object? scheduledAt = null,
    Object? status = freezed,
    Object? convergence = freezed,
    Object? ourProcess = freezed,
    Object? aiProcess = freezed,
    Object? pick = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      sport: null == sport
          ? _value.sport
          : sport // ignore: cast_nullable_to_non_nullable
              as String,
      homeTeam: null == homeTeam
          ? _value.homeTeam
          : homeTeam // ignore: cast_nullable_to_non_nullable
              as String,
      awayTeam: null == awayTeam
          ? _value.awayTeam
          : awayTeam // ignore: cast_nullable_to_non_nullable
              as String,
      scheduledAt: null == scheduledAt
          ? _value.scheduledAt
          : scheduledAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      status: freezed == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String?,
      convergence: freezed == convergence
          ? _value.convergence
          : convergence // ignore: cast_nullable_to_non_nullable
              as Convergence?,
      ourProcess: freezed == ourProcess
          ? _value.ourProcess
          : ourProcess // ignore: cast_nullable_to_non_nullable
              as Grade?,
      aiProcess: freezed == aiProcess
          ? _value.aiProcess
          : aiProcess // ignore: cast_nullable_to_non_nullable
              as Grade?,
      pick: freezed == pick
          ? _value.pick
          : pick // ignore: cast_nullable_to_non_nullable
              as Pick?,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $ConvergenceCopyWith<$Res>? get convergence {
    if (_value.convergence == null) {
      return null;
    }

    return $ConvergenceCopyWith<$Res>(_value.convergence!, (value) {
      return _then(_value.copyWith(convergence: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $GradeCopyWith<$Res>? get ourProcess {
    if (_value.ourProcess == null) {
      return null;
    }

    return $GradeCopyWith<$Res>(_value.ourProcess!, (value) {
      return _then(_value.copyWith(ourProcess: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $GradeCopyWith<$Res>? get aiProcess {
    if (_value.aiProcess == null) {
      return null;
    }

    return $GradeCopyWith<$Res>(_value.aiProcess!, (value) {
      return _then(_value.copyWith(aiProcess: value) as $Val);
    });
  }

  @override
  @pragma('vm:prefer-inline')
  $PickCopyWith<$Res>? get pick {
    if (_value.pick == null) {
      return null;
    }

    return $PickCopyWith<$Res>(_value.pick!, (value) {
      return _then(_value.copyWith(pick: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$GameImplCopyWith<$Res> implements $GameCopyWith<$Res> {
  factory _$$GameImplCopyWith(
          _$GameImpl value, $Res Function(_$GameImpl) then) =
      __$$GameImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String sport,
      @HiveField(2) String homeTeam,
      @HiveField(3) String awayTeam,
      @HiveField(4) DateTime scheduledAt,
      @HiveField(5) String? status,
      @HiveField(6) Convergence? convergence,
      @HiveField(7) Grade? ourProcess,
      @HiveField(8) Grade? aiProcess,
      @HiveField(9) Pick? pick});

  @override
  $ConvergenceCopyWith<$Res>? get convergence;
  @override
  $GradeCopyWith<$Res>? get ourProcess;
  @override
  $GradeCopyWith<$Res>? get aiProcess;
  @override
  $PickCopyWith<$Res>? get pick;
}

/// @nodoc
class __$$GameImplCopyWithImpl<$Res>
    extends _$GameCopyWithImpl<$Res, _$GameImpl>
    implements _$$GameImplCopyWith<$Res> {
  __$$GameImplCopyWithImpl(_$GameImpl _value, $Res Function(_$GameImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? sport = null,
    Object? homeTeam = null,
    Object? awayTeam = null,
    Object? scheduledAt = null,
    Object? status = freezed,
    Object? convergence = freezed,
    Object? ourProcess = freezed,
    Object? aiProcess = freezed,
    Object? pick = freezed,
  }) {
    return _then(_$GameImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      sport: null == sport
          ? _value.sport
          : sport // ignore: cast_nullable_to_non_nullable
              as String,
      homeTeam: null == homeTeam
          ? _value.homeTeam
          : homeTeam // ignore: cast_nullable_to_non_nullable
              as String,
      awayTeam: null == awayTeam
          ? _value.awayTeam
          : awayTeam // ignore: cast_nullable_to_non_nullable
              as String,
      scheduledAt: null == scheduledAt
          ? _value.scheduledAt
          : scheduledAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      status: freezed == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String?,
      convergence: freezed == convergence
          ? _value.convergence
          : convergence // ignore: cast_nullable_to_non_nullable
              as Convergence?,
      ourProcess: freezed == ourProcess
          ? _value.ourProcess
          : ourProcess // ignore: cast_nullable_to_non_nullable
              as Grade?,
      aiProcess: freezed == aiProcess
          ? _value.aiProcess
          : aiProcess // ignore: cast_nullable_to_non_nullable
              as Grade?,
      pick: freezed == pick
          ? _value.pick
          : pick // ignore: cast_nullable_to_non_nullable
              as Pick?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GameImpl implements _Game {
  const _$GameImpl(
      {@HiveField(0) required this.id,
      @HiveField(1) required this.sport,
      @HiveField(2) required this.homeTeam,
      @HiveField(3) required this.awayTeam,
      @HiveField(4) required this.scheduledAt,
      @HiveField(5) this.status,
      @HiveField(6) this.convergence,
      @HiveField(7) this.ourProcess,
      @HiveField(8) this.aiProcess,
      @HiveField(9) this.pick});

  factory _$GameImpl.fromJson(Map<String, dynamic> json) =>
      _$$GameImplFromJson(json);

  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String sport;
  @override
  @HiveField(2)
  final String homeTeam;
  @override
  @HiveField(3)
  final String awayTeam;
  @override
  @HiveField(4)
  final DateTime scheduledAt;
  @override
  @HiveField(5)
  final String? status;
  @override
  @HiveField(6)
  final Convergence? convergence;
  @override
  @HiveField(7)
  final Grade? ourProcess;
  @override
  @HiveField(8)
  final Grade? aiProcess;
  @override
  @HiveField(9)
  final Pick? pick;

  @override
  String toString() {
    return 'Game(id: $id, sport: $sport, homeTeam: $homeTeam, awayTeam: $awayTeam, scheduledAt: $scheduledAt, status: $status, convergence: $convergence, ourProcess: $ourProcess, aiProcess: $aiProcess, pick: $pick)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GameImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.sport, sport) || other.sport == sport) &&
            (identical(other.homeTeam, homeTeam) ||
                other.homeTeam == homeTeam) &&
            (identical(other.awayTeam, awayTeam) ||
                other.awayTeam == awayTeam) &&
            (identical(other.scheduledAt, scheduledAt) ||
                other.scheduledAt == scheduledAt) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.convergence, convergence) ||
                other.convergence == convergence) &&
            (identical(other.ourProcess, ourProcess) ||
                other.ourProcess == ourProcess) &&
            (identical(other.aiProcess, aiProcess) ||
                other.aiProcess == aiProcess) &&
            (identical(other.pick, pick) || other.pick == pick));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, sport, homeTeam, awayTeam,
      scheduledAt, status, convergence, ourProcess, aiProcess, pick);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$GameImplCopyWith<_$GameImpl> get copyWith =>
      __$$GameImplCopyWithImpl<_$GameImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GameImplToJson(
      this,
    );
  }
}

abstract class _Game implements Game {
  const factory _Game(
      {@HiveField(0) required final String id,
      @HiveField(1) required final String sport,
      @HiveField(2) required final String homeTeam,
      @HiveField(3) required final String awayTeam,
      @HiveField(4) required final DateTime scheduledAt,
      @HiveField(5) final String? status,
      @HiveField(6) final Convergence? convergence,
      @HiveField(7) final Grade? ourProcess,
      @HiveField(8) final Grade? aiProcess,
      @HiveField(9) final Pick? pick}) = _$GameImpl;

  factory _Game.fromJson(Map<String, dynamic> json) = _$GameImpl.fromJson;

  @override
  @HiveField(0)
  String get id;
  @override
  @HiveField(1)
  String get sport;
  @override
  @HiveField(2)
  String get homeTeam;
  @override
  @HiveField(3)
  String get awayTeam;
  @override
  @HiveField(4)
  DateTime get scheduledAt;
  @override
  @HiveField(5)
  String? get status;
  @override
  @HiveField(6)
  Convergence? get convergence;
  @override
  @HiveField(7)
  Grade? get ourProcess;
  @override
  @HiveField(8)
  Grade? get aiProcess;
  @override
  @HiveField(9)
  Pick? get pick;
  @override
  @JsonKey(ignore: true)
  _$$GameImplCopyWith<_$GameImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

Grade _$GradeFromJson(Map<String, dynamic> json) {
  return _Grade.fromJson(json);
}

/// @nodoc
mixin _$Grade {
  @HiveField(0)
  String get grade => throw _privateConstructorUsedError;
  @HiveField(1)
  double get score => throw _privateConstructorUsedError;
  @HiveField(2)
  double get confidence => throw _privateConstructorUsedError;
  @HiveField(3)
  String? get thesis => throw _privateConstructorUsedError;
  @HiveField(4)
  List<String>? get keyFactors => throw _privateConstructorUsedError;
  @HiveField(5)
  Map<String, dynamic>? get details => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $GradeCopyWith<Grade> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $GradeCopyWith<$Res> {
  factory $GradeCopyWith(Grade value, $Res Function(Grade) then) =
      _$GradeCopyWithImpl<$Res, Grade>;
  @useResult
  $Res call(
      {@HiveField(0) String grade,
      @HiveField(1) double score,
      @HiveField(2) double confidence,
      @HiveField(3) String? thesis,
      @HiveField(4) List<String>? keyFactors,
      @HiveField(5) Map<String, dynamic>? details});
}

/// @nodoc
class _$GradeCopyWithImpl<$Res, $Val extends Grade>
    implements $GradeCopyWith<$Res> {
  _$GradeCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? grade = null,
    Object? score = null,
    Object? confidence = null,
    Object? thesis = freezed,
    Object? keyFactors = freezed,
    Object? details = freezed,
  }) {
    return _then(_value.copyWith(
      grade: null == grade
          ? _value.grade
          : grade // ignore: cast_nullable_to_non_nullable
              as String,
      score: null == score
          ? _value.score
          : score // ignore: cast_nullable_to_non_nullable
              as double,
      confidence: null == confidence
          ? _value.confidence
          : confidence // ignore: cast_nullable_to_non_nullable
              as double,
      thesis: freezed == thesis
          ? _value.thesis
          : thesis // ignore: cast_nullable_to_non_nullable
              as String?,
      keyFactors: freezed == keyFactors
          ? _value.keyFactors
          : keyFactors // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      details: freezed == details
          ? _value.details
          : details // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$GradeImplCopyWith<$Res> implements $GradeCopyWith<$Res> {
  factory _$$GradeImplCopyWith(
          _$GradeImpl value, $Res Function(_$GradeImpl) then) =
      __$$GradeImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String grade,
      @HiveField(1) double score,
      @HiveField(2) double confidence,
      @HiveField(3) String? thesis,
      @HiveField(4) List<String>? keyFactors,
      @HiveField(5) Map<String, dynamic>? details});
}

/// @nodoc
class __$$GradeImplCopyWithImpl<$Res>
    extends _$GradeCopyWithImpl<$Res, _$GradeImpl>
    implements _$$GradeImplCopyWith<$Res> {
  __$$GradeImplCopyWithImpl(
      _$GradeImpl _value, $Res Function(_$GradeImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? grade = null,
    Object? score = null,
    Object? confidence = null,
    Object? thesis = freezed,
    Object? keyFactors = freezed,
    Object? details = freezed,
  }) {
    return _then(_$GradeImpl(
      grade: null == grade
          ? _value.grade
          : grade // ignore: cast_nullable_to_non_nullable
              as String,
      score: null == score
          ? _value.score
          : score // ignore: cast_nullable_to_non_nullable
              as double,
      confidence: null == confidence
          ? _value.confidence
          : confidence // ignore: cast_nullable_to_non_nullable
              as double,
      thesis: freezed == thesis
          ? _value.thesis
          : thesis // ignore: cast_nullable_to_non_nullable
              as String?,
      keyFactors: freezed == keyFactors
          ? _value._keyFactors
          : keyFactors // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      details: freezed == details
          ? _value._details
          : details // ignore: cast_nullable_to_non_nullable
              as Map<String, dynamic>?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$GradeImpl implements _Grade {
  const _$GradeImpl(
      {@HiveField(0) required this.grade,
      @HiveField(1) required this.score,
      @HiveField(2) required this.confidence,
      @HiveField(3) this.thesis,
      @HiveField(4) final List<String>? keyFactors,
      @HiveField(5) final Map<String, dynamic>? details})
      : _keyFactors = keyFactors,
        _details = details;

  factory _$GradeImpl.fromJson(Map<String, dynamic> json) =>
      _$$GradeImplFromJson(json);

  @override
  @HiveField(0)
  final String grade;
  @override
  @HiveField(1)
  final double score;
  @override
  @HiveField(2)
  final double confidence;
  @override
  @HiveField(3)
  final String? thesis;
  final List<String>? _keyFactors;
  @override
  @HiveField(4)
  List<String>? get keyFactors {
    final value = _keyFactors;
    if (value == null) return null;
    if (_keyFactors is EqualUnmodifiableListView) return _keyFactors;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final Map<String, dynamic>? _details;
  @override
  @HiveField(5)
  Map<String, dynamic>? get details {
    final value = _details;
    if (value == null) return null;
    if (_details is EqualUnmodifiableMapView) return _details;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  @override
  String toString() {
    return 'Grade(grade: $grade, score: $score, confidence: $confidence, thesis: $thesis, keyFactors: $keyFactors, details: $details)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GradeImpl &&
            (identical(other.grade, grade) || other.grade == grade) &&
            (identical(other.score, score) || other.score == score) &&
            (identical(other.confidence, confidence) ||
                other.confidence == confidence) &&
            (identical(other.thesis, thesis) || other.thesis == thesis) &&
            const DeepCollectionEquality()
                .equals(other._keyFactors, _keyFactors) &&
            const DeepCollectionEquality().equals(other._details, _details));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      grade,
      score,
      confidence,
      thesis,
      const DeepCollectionEquality().hash(_keyFactors),
      const DeepCollectionEquality().hash(_details));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$GradeImplCopyWith<_$GradeImpl> get copyWith =>
      __$$GradeImplCopyWithImpl<_$GradeImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$GradeImplToJson(
      this,
    );
  }
}

abstract class _Grade implements Grade {
  const factory _Grade(
      {@HiveField(0) required final String grade,
      @HiveField(1) required final double score,
      @HiveField(2) required final double confidence,
      @HiveField(3) final String? thesis,
      @HiveField(4) final List<String>? keyFactors,
      @HiveField(5) final Map<String, dynamic>? details}) = _$GradeImpl;

  factory _Grade.fromJson(Map<String, dynamic> json) = _$GradeImpl.fromJson;

  @override
  @HiveField(0)
  String get grade;
  @override
  @HiveField(1)
  double get score;
  @override
  @HiveField(2)
  double get confidence;
  @override
  @HiveField(3)
  String? get thesis;
  @override
  @HiveField(4)
  List<String>? get keyFactors;
  @override
  @HiveField(5)
  Map<String, dynamic>? get details;
  @override
  @JsonKey(ignore: true)
  _$$GradeImplCopyWith<_$GradeImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

Convergence _$ConvergenceFromJson(Map<String, dynamic> json) {
  return _Convergence.fromJson(json);
}

/// @nodoc
mixin _$Convergence {
  @HiveField(0)
  String get status => throw _privateConstructorUsedError;
  @HiveField(1)
  double get consensusScore => throw _privateConstructorUsedError;
  @HiveField(2)
  String get consensusGrade => throw _privateConstructorUsedError;
  @HiveField(3)
  double get delta => throw _privateConstructorUsedError;
  @HiveField(4)
  double get variance => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ConvergenceCopyWith<Convergence> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ConvergenceCopyWith<$Res> {
  factory $ConvergenceCopyWith(
          Convergence value, $Res Function(Convergence) then) =
      _$ConvergenceCopyWithImpl<$Res, Convergence>;
  @useResult
  $Res call(
      {@HiveField(0) String status,
      @HiveField(1) double consensusScore,
      @HiveField(2) String consensusGrade,
      @HiveField(3) double delta,
      @HiveField(4) double variance});
}

/// @nodoc
class _$ConvergenceCopyWithImpl<$Res, $Val extends Convergence>
    implements $ConvergenceCopyWith<$Res> {
  _$ConvergenceCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? consensusScore = null,
    Object? consensusGrade = null,
    Object? delta = null,
    Object? variance = null,
  }) {
    return _then(_value.copyWith(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      consensusScore: null == consensusScore
          ? _value.consensusScore
          : consensusScore // ignore: cast_nullable_to_non_nullable
              as double,
      consensusGrade: null == consensusGrade
          ? _value.consensusGrade
          : consensusGrade // ignore: cast_nullable_to_non_nullable
              as String,
      delta: null == delta
          ? _value.delta
          : delta // ignore: cast_nullable_to_non_nullable
              as double,
      variance: null == variance
          ? _value.variance
          : variance // ignore: cast_nullable_to_non_nullable
              as double,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ConvergenceImplCopyWith<$Res>
    implements $ConvergenceCopyWith<$Res> {
  factory _$$ConvergenceImplCopyWith(
          _$ConvergenceImpl value, $Res Function(_$ConvergenceImpl) then) =
      __$$ConvergenceImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String status,
      @HiveField(1) double consensusScore,
      @HiveField(2) String consensusGrade,
      @HiveField(3) double delta,
      @HiveField(4) double variance});
}

/// @nodoc
class __$$ConvergenceImplCopyWithImpl<$Res>
    extends _$ConvergenceCopyWithImpl<$Res, _$ConvergenceImpl>
    implements _$$ConvergenceImplCopyWith<$Res> {
  __$$ConvergenceImplCopyWithImpl(
      _$ConvergenceImpl _value, $Res Function(_$ConvergenceImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? status = null,
    Object? consensusScore = null,
    Object? consensusGrade = null,
    Object? delta = null,
    Object? variance = null,
  }) {
    return _then(_$ConvergenceImpl(
      status: null == status
          ? _value.status
          : status // ignore: cast_nullable_to_non_nullable
              as String,
      consensusScore: null == consensusScore
          ? _value.consensusScore
          : consensusScore // ignore: cast_nullable_to_non_nullable
              as double,
      consensusGrade: null == consensusGrade
          ? _value.consensusGrade
          : consensusGrade // ignore: cast_nullable_to_non_nullable
              as String,
      delta: null == delta
          ? _value.delta
          : delta // ignore: cast_nullable_to_non_nullable
              as double,
      variance: null == variance
          ? _value.variance
          : variance // ignore: cast_nullable_to_non_nullable
              as double,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ConvergenceImpl implements _Convergence {
  const _$ConvergenceImpl(
      {@HiveField(0) required this.status,
      @HiveField(1) required this.consensusScore,
      @HiveField(2) required this.consensusGrade,
      @HiveField(3) required this.delta,
      @HiveField(4) required this.variance});

  factory _$ConvergenceImpl.fromJson(Map<String, dynamic> json) =>
      _$$ConvergenceImplFromJson(json);

  @override
  @HiveField(0)
  final String status;
  @override
  @HiveField(1)
  final double consensusScore;
  @override
  @HiveField(2)
  final String consensusGrade;
  @override
  @HiveField(3)
  final double delta;
  @override
  @HiveField(4)
  final double variance;

  @override
  String toString() {
    return 'Convergence(status: $status, consensusScore: $consensusScore, consensusGrade: $consensusGrade, delta: $delta, variance: $variance)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ConvergenceImpl &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.consensusScore, consensusScore) ||
                other.consensusScore == consensusScore) &&
            (identical(other.consensusGrade, consensusGrade) ||
                other.consensusGrade == consensusGrade) &&
            (identical(other.delta, delta) || other.delta == delta) &&
            (identical(other.variance, variance) ||
                other.variance == variance));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType, status, consensusScore, consensusGrade, delta, variance);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ConvergenceImplCopyWith<_$ConvergenceImpl> get copyWith =>
      __$$ConvergenceImplCopyWithImpl<_$ConvergenceImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ConvergenceImplToJson(
      this,
    );
  }
}

abstract class _Convergence implements Convergence {
  const factory _Convergence(
      {@HiveField(0) required final String status,
      @HiveField(1) required final double consensusScore,
      @HiveField(2) required final String consensusGrade,
      @HiveField(3) required final double delta,
      @HiveField(4) required final double variance}) = _$ConvergenceImpl;

  factory _Convergence.fromJson(Map<String, dynamic> json) =
      _$ConvergenceImpl.fromJson;

  @override
  @HiveField(0)
  String get status;
  @override
  @HiveField(1)
  double get consensusScore;
  @override
  @HiveField(2)
  String get consensusGrade;
  @override
  @HiveField(3)
  double get delta;
  @override
  @HiveField(4)
  double get variance;
  @override
  @JsonKey(ignore: true)
  _$$ConvergenceImplCopyWith<_$ConvergenceImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

Pick _$PickFromJson(Map<String, dynamic> json) {
  return _Pick.fromJson(json);
}

/// @nodoc
mixin _$Pick {
  @HiveField(0)
  String get id => throw _privateConstructorUsedError;
  @HiveField(1)
  String get side => throw _privateConstructorUsedError;
  @HiveField(2)
  String get grade => throw _privateConstructorUsedError;
  @HiveField(3)
  double get confidence => throw _privateConstructorUsedError;
  @HiveField(4)
  String? get sizing => throw _privateConstructorUsedError;
  @HiveField(5)
  String? get result => throw _privateConstructorUsedError;
  @HiveField(6)
  double? get profit => throw _privateConstructorUsedError;
  @HiveField(7)
  DateTime get createdAt => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $PickCopyWith<Pick> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PickCopyWith<$Res> {
  factory $PickCopyWith(Pick value, $Res Function(Pick) then) =
      _$PickCopyWithImpl<$Res, Pick>;
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String side,
      @HiveField(2) String grade,
      @HiveField(3) double confidence,
      @HiveField(4) String? sizing,
      @HiveField(5) String? result,
      @HiveField(6) double? profit,
      @HiveField(7) DateTime createdAt});
}

/// @nodoc
class _$PickCopyWithImpl<$Res, $Val extends Pick>
    implements $PickCopyWith<$Res> {
  _$PickCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? side = null,
    Object? grade = null,
    Object? confidence = null,
    Object? sizing = freezed,
    Object? result = freezed,
    Object? profit = freezed,
    Object? createdAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      side: null == side
          ? _value.side
          : side // ignore: cast_nullable_to_non_nullable
              as String,
      grade: null == grade
          ? _value.grade
          : grade // ignore: cast_nullable_to_non_nullable
              as String,
      confidence: null == confidence
          ? _value.confidence
          : confidence // ignore: cast_nullable_to_non_nullable
              as double,
      sizing: freezed == sizing
          ? _value.sizing
          : sizing // ignore: cast_nullable_to_non_nullable
              as String?,
      result: freezed == result
          ? _value.result
          : result // ignore: cast_nullable_to_non_nullable
              as String?,
      profit: freezed == profit
          ? _value.profit
          : profit // ignore: cast_nullable_to_non_nullable
              as double?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$PickImplCopyWith<$Res> implements $PickCopyWith<$Res> {
  factory _$$PickImplCopyWith(
          _$PickImpl value, $Res Function(_$PickImpl) then) =
      __$$PickImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String side,
      @HiveField(2) String grade,
      @HiveField(3) double confidence,
      @HiveField(4) String? sizing,
      @HiveField(5) String? result,
      @HiveField(6) double? profit,
      @HiveField(7) DateTime createdAt});
}

/// @nodoc
class __$$PickImplCopyWithImpl<$Res>
    extends _$PickCopyWithImpl<$Res, _$PickImpl>
    implements _$$PickImplCopyWith<$Res> {
  __$$PickImplCopyWithImpl(_$PickImpl _value, $Res Function(_$PickImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? side = null,
    Object? grade = null,
    Object? confidence = null,
    Object? sizing = freezed,
    Object? result = freezed,
    Object? profit = freezed,
    Object? createdAt = null,
  }) {
    return _then(_$PickImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      side: null == side
          ? _value.side
          : side // ignore: cast_nullable_to_non_nullable
              as String,
      grade: null == grade
          ? _value.grade
          : grade // ignore: cast_nullable_to_non_nullable
              as String,
      confidence: null == confidence
          ? _value.confidence
          : confidence // ignore: cast_nullable_to_non_nullable
              as double,
      sizing: freezed == sizing
          ? _value.sizing
          : sizing // ignore: cast_nullable_to_non_nullable
              as String?,
      result: freezed == result
          ? _value.result
          : result // ignore: cast_nullable_to_non_nullable
              as String?,
      profit: freezed == profit
          ? _value.profit
          : profit // ignore: cast_nullable_to_non_nullable
              as double?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$PickImpl implements _Pick {
  const _$PickImpl(
      {@HiveField(0) required this.id,
      @HiveField(1) required this.side,
      @HiveField(2) required this.grade,
      @HiveField(3) required this.confidence,
      @HiveField(4) this.sizing,
      @HiveField(5) this.result,
      @HiveField(6) this.profit,
      @HiveField(7) required this.createdAt});

  factory _$PickImpl.fromJson(Map<String, dynamic> json) =>
      _$$PickImplFromJson(json);

  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String side;
  @override
  @HiveField(2)
  final String grade;
  @override
  @HiveField(3)
  final double confidence;
  @override
  @HiveField(4)
  final String? sizing;
  @override
  @HiveField(5)
  final String? result;
  @override
  @HiveField(6)
  final double? profit;
  @override
  @HiveField(7)
  final DateTime createdAt;

  @override
  String toString() {
    return 'Pick(id: $id, side: $side, grade: $grade, confidence: $confidence, sizing: $sizing, result: $result, profit: $profit, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PickImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.side, side) || other.side == side) &&
            (identical(other.grade, grade) || other.grade == grade) &&
            (identical(other.confidence, confidence) ||
                other.confidence == confidence) &&
            (identical(other.sizing, sizing) || other.sizing == sizing) &&
            (identical(other.result, result) || other.result == result) &&
            (identical(other.profit, profit) || other.profit == profit) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, id, side, grade, confidence,
      sizing, result, profit, createdAt);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PickImplCopyWith<_$PickImpl> get copyWith =>
      __$$PickImplCopyWithImpl<_$PickImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PickImplToJson(
      this,
    );
  }
}

abstract class _Pick implements Pick {
  const factory _Pick(
      {@HiveField(0) required final String id,
      @HiveField(1) required final String side,
      @HiveField(2) required final String grade,
      @HiveField(3) required final double confidence,
      @HiveField(4) final String? sizing,
      @HiveField(5) final String? result,
      @HiveField(6) final double? profit,
      @HiveField(7) required final DateTime createdAt}) = _$PickImpl;

  factory _Pick.fromJson(Map<String, dynamic> json) = _$PickImpl.fromJson;

  @override
  @HiveField(0)
  String get id;
  @override
  @HiveField(1)
  String get side;
  @override
  @HiveField(2)
  String get grade;
  @override
  @HiveField(3)
  double get confidence;
  @override
  @HiveField(4)
  String? get sizing;
  @override
  @HiveField(5)
  String? get result;
  @override
  @HiveField(6)
  double? get profit;
  @override
  @HiveField(7)
  DateTime get createdAt;
  @override
  @JsonKey(ignore: true)
  _$$PickImplCopyWith<_$PickImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
