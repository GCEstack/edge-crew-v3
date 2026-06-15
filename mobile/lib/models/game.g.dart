// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'game.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class GameAdapter extends TypeAdapter<Game> {
  @override
  final int typeId = 1;

  @override
  Game read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Game(
      id: fields[0] as String,
      sport: fields[1] as String,
      homeTeam: fields[2] as String,
      awayTeam: fields[3] as String,
      scheduledAt: fields[4] as DateTime,
      status: fields[5] as String?,
      convergence: fields[6] as Convergence?,
      ourProcess: fields[7] as Grade?,
      aiProcess: fields[8] as Grade?,
      pick: fields[9] as Pick?,
    );
  }

  @override
  void write(BinaryWriter writer, Game obj) {
    writer
      ..writeByte(10)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.sport)
      ..writeByte(2)
      ..write(obj.homeTeam)
      ..writeByte(3)
      ..write(obj.awayTeam)
      ..writeByte(4)
      ..write(obj.scheduledAt)
      ..writeByte(5)
      ..write(obj.status)
      ..writeByte(6)
      ..write(obj.convergence)
      ..writeByte(7)
      ..write(obj.ourProcess)
      ..writeByte(8)
      ..write(obj.aiProcess)
      ..writeByte(9)
      ..write(obj.pick);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is GameAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class GradeAdapter extends TypeAdapter<Grade> {
  @override
  final int typeId = 2;

  @override
  Grade read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Grade(
      grade: fields[0] as String,
      score: fields[1] as double,
      confidence: fields[2] as double,
      thesis: fields[3] as String?,
      keyFactors: (fields[4] as List?)?.cast<String>(),
      details: (fields[5] as Map?)?.cast<String, dynamic>(),
    );
  }

  @override
  void write(BinaryWriter writer, Grade obj) {
    writer
      ..writeByte(6)
      ..writeByte(0)
      ..write(obj.grade)
      ..writeByte(1)
      ..write(obj.score)
      ..writeByte(2)
      ..write(obj.confidence)
      ..writeByte(3)
      ..write(obj.thesis)
      ..writeByte(4)
      ..write(obj.keyFactors)
      ..writeByte(5)
      ..write(obj.details);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is GradeAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ConvergenceAdapter extends TypeAdapter<Convergence> {
  @override
  final int typeId = 3;

  @override
  Convergence read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Convergence(
      status: fields[0] as String,
      consensusScore: fields[1] as double,
      consensusGrade: fields[2] as String,
      delta: fields[3] as double,
      variance: fields[4] as double,
    );
  }

  @override
  void write(BinaryWriter writer, Convergence obj) {
    writer
      ..writeByte(5)
      ..writeByte(0)
      ..write(obj.status)
      ..writeByte(1)
      ..write(obj.consensusScore)
      ..writeByte(2)
      ..write(obj.consensusGrade)
      ..writeByte(3)
      ..write(obj.delta)
      ..writeByte(4)
      ..write(obj.variance);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ConvergenceAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class PickAdapter extends TypeAdapter<Pick> {
  @override
  final int typeId = 4;

  @override
  Pick read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Pick(
      id: fields[0] as String,
      side: fields[1] as String,
      grade: fields[2] as String,
      confidence: fields[3] as double,
      sizing: fields[4] as String?,
      result: fields[5] as String?,
      profit: fields[6] as double?,
      createdAt: fields[7] as DateTime,
    );
  }

  @override
  void write(BinaryWriter writer, Pick obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.side)
      ..writeByte(2)
      ..write(obj.grade)
      ..writeByte(3)
      ..write(obj.confidence)
      ..writeByte(4)
      ..write(obj.sizing)
      ..writeByte(5)
      ..write(obj.result)
      ..writeByte(6)
      ..write(obj.profit)
      ..writeByte(7)
      ..write(obj.createdAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PickAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$GameImpl _$$GameImplFromJson(Map<String, dynamic> json) => _$GameImpl(
      id: json['id'] as String,
      sport: json['sport'] as String,
      homeTeam: json['homeTeam'] as String,
      awayTeam: json['awayTeam'] as String,
      scheduledAt: DateTime.parse(json['scheduledAt'] as String),
      status: json['status'] as String?,
      convergence: json['convergence'] == null
          ? null
          : Convergence.fromJson(json['convergence'] as Map<String, dynamic>),
      ourProcess: json['ourProcess'] == null
          ? null
          : Grade.fromJson(json['ourProcess'] as Map<String, dynamic>),
      aiProcess: json['aiProcess'] == null
          ? null
          : Grade.fromJson(json['aiProcess'] as Map<String, dynamic>),
      pick: json['pick'] == null
          ? null
          : Pick.fromJson(json['pick'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$$GameImplToJson(_$GameImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'sport': instance.sport,
      'homeTeam': instance.homeTeam,
      'awayTeam': instance.awayTeam,
      'scheduledAt': instance.scheduledAt.toIso8601String(),
      'status': instance.status,
      'convergence': instance.convergence,
      'ourProcess': instance.ourProcess,
      'aiProcess': instance.aiProcess,
      'pick': instance.pick,
    };

_$GradeImpl _$$GradeImplFromJson(Map<String, dynamic> json) => _$GradeImpl(
      grade: json['grade'] as String,
      score: (json['score'] as num).toDouble(),
      confidence: (json['confidence'] as num).toDouble(),
      thesis: json['thesis'] as String?,
      keyFactors: (json['keyFactors'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      details: json['details'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$$GradeImplToJson(_$GradeImpl instance) =>
    <String, dynamic>{
      'grade': instance.grade,
      'score': instance.score,
      'confidence': instance.confidence,
      'thesis': instance.thesis,
      'keyFactors': instance.keyFactors,
      'details': instance.details,
    };

_$ConvergenceImpl _$$ConvergenceImplFromJson(Map<String, dynamic> json) =>
    _$ConvergenceImpl(
      status: json['status'] as String,
      consensusScore: (json['consensusScore'] as num).toDouble(),
      consensusGrade: json['consensusGrade'] as String,
      delta: (json['delta'] as num).toDouble(),
      variance: (json['variance'] as num).toDouble(),
    );

Map<String, dynamic> _$$ConvergenceImplToJson(_$ConvergenceImpl instance) =>
    <String, dynamic>{
      'status': instance.status,
      'consensusScore': instance.consensusScore,
      'consensusGrade': instance.consensusGrade,
      'delta': instance.delta,
      'variance': instance.variance,
    };

_$PickImpl _$$PickImplFromJson(Map<String, dynamic> json) => _$PickImpl(
      id: json['id'] as String,
      side: json['side'] as String,
      grade: json['grade'] as String,
      confidence: (json['confidence'] as num).toDouble(),
      sizing: json['sizing'] as String?,
      result: json['result'] as String?,
      profit: (json['profit'] as num?)?.toDouble(),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$$PickImplToJson(_$PickImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'side': instance.side,
      'grade': instance.grade,
      'confidence': instance.confidence,
      'sizing': instance.sizing,
      'result': instance.result,
      'profit': instance.profit,
      'createdAt': instance.createdAt.toIso8601String(),
    };
