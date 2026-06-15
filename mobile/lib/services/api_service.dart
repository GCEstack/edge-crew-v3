import 'package:dio/dio.dart';
import '../config/environment.dart';
import '../models/game.dart';
import '../models/user.dart';

class ApiService {
  ApiService({Dio? dio}) : _dio = dio ?? _createDio();

  final Dio _dio;

  static Dio _createDio() {
    return Dio(
      BaseOptions(
        baseUrl: Environment.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 600),
        headers: {'Content-Type': 'application/json'},
      ),
    );
  }

  Future<HealthStatus> checkHealth() async {
    final response = await _dio.get('/health');
    return HealthStatus.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<Game>> getGames(String? sport) async {
    final response = await _dio.get('/api/games', queryParameters: {
      if (sport != null && sport.isNotEmpty) 'sport': sport.toLowerCase(),
    });
    return (response.data as List)
        .map((json) => Game.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<Game> getGame(String id) async {
    final response = await _dio.get('/api/games/$id');
    return Game.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Convergence> gradeGame(String id) async {
    final response = await _dio.post('/api/games/$id/grade');
    return Convergence.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<Pick>> getPicks() async {
    final response = await _dio.get('/api/picks');
    return (response.data as List)
        .map((json) => Pick.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  Future<Pick> createPick(PickRequest request) async {
    final response = await _dio.post('/api/picks', data: request.toJson());
    return Pick.fromJson(response.data as Map<String, dynamic>);
  }

  Future<UserProfile> getUserProfile() async {
    final response = await _dio.get('/api/user/profile');
    return UserProfile.fromJson(response.data as Map<String, dynamic>);
  }

  Future<UserProfile> updateProfile(UserProfile profile) async {
    final response =
        await _dio.put('/api/user/profile', data: profile.toJson());
    return UserProfile.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Bankroll> getBankroll() async {
    final response = await _dio.get('/api/bankroll');
    return Bankroll.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Bankroll> addTransaction(Transaction transaction) async {
    final response = await _dio.post(
      '/api/bankroll/transaction',
      data: transaction.toJson(),
    );
    return Bankroll.fromJson(response.data as Map<String, dynamic>);
  }
}

class HealthStatus {
  final String status;
  final String? version;

  HealthStatus({required this.status, this.version});

  factory HealthStatus.fromJson(Map<String, dynamic> json) => HealthStatus(
        status: json['status'] as String? ?? 'unknown',
        version: json['version'] as String?,
      );
}

class PickRequest {
  final String gameId;
  final String side;
  final String grade;
  final double confidence;
  final String? sizing;

  PickRequest({
    required this.gameId,
    required this.side,
    required this.grade,
    required this.confidence,
    this.sizing,
  });

  Map<String, dynamic> toJson() => {
        'gameId': gameId,
        'side': side,
        'grade': grade,
        'confidence': confidence,
        'sizing': sizing,
      };
}

class GameUpdate {
  final String gameId;
  final String type;
  final Map<String, dynamic> data;
  final DateTime timestamp;

  GameUpdate({
    required this.gameId,
    required this.type,
    required this.data,
    required this.timestamp,
  });

  factory GameUpdate.fromJson(Map<String, dynamic> json) => GameUpdate(
        gameId: json['gameId'] as String,
        type: json['type'] as String,
        data: json['data'] as Map<String, dynamic>,
        timestamp: DateTime.parse(json['timestamp'] as String),
      );
}

class Bankroll {
  final double currentBalance;
  final double totalWagered;
  final double totalProfit;
  final double roi;
  final int wins;
  final int losses;
  final int pushes;

  Bankroll({
    required this.currentBalance,
    required this.totalWagered,
    required this.totalProfit,
    required this.roi,
    required this.wins,
    required this.losses,
    required this.pushes,
  });

  factory Bankroll.fromJson(Map<String, dynamic> json) => Bankroll(
        currentBalance: (json['currentBalance'] as num?)?.toDouble() ?? 0.0,
        totalWagered: (json['totalWagered'] as num?)?.toDouble() ?? 0.0,
        totalProfit: (json['totalProfit'] as num?)?.toDouble() ?? 0.0,
        roi: (json['roi'] as num?)?.toDouble() ?? 0.0,
        wins: (json['wins'] as num?)?.toInt() ?? 0,
        losses: (json['losses'] as num?)?.toInt() ?? 0,
        pushes: (json['pushes'] as num?)?.toInt() ?? 0,
      );
}

class Transaction {
  final String type;
  final double amount;
  final String? description;

  Transaction({
    required this.type,
    required this.amount,
    this.description,
  });

  Map<String, dynamic> toJson() => {
        'type': type,
        'amount': amount,
        'description': description,
      };
}
