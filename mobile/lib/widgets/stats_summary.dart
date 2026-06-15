import 'package:flutter/material.dart';

/// A compact bankroll / record summary shown at the top of the home screen.
class StatsSummary extends StatelessWidget {
  const StatsSummary({
    super.key,
    this.bankroll,
    this.wins = 0,
    this.losses = 0,
    this.pushes = 0,
    this.profit = 0.0,
  });

  final double? bankroll;
  final int wins;
  final int losses;
  final int pushes;
  final double profit;

  int get total => wins + losses + pushes;

  @override
  Widget build(BuildContext context) {
    final bankrollValue = bankroll ?? 1000.0;
    final winRate = total > 0 ? wins / total : 0.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'BANKROLL',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '\$${bankrollValue.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFD4A017),
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: profit >= 0 ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${profit >= 0 ? '+' : ''}\$${profit.toStringAsFixed(0)}',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: profit >= 0 ? Colors.green : Colors.red,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(label: 'WINS', value: '$wins', color: Colors.green),
                _StatItem(label: 'LOSSES', value: '$losses', color: Colors.red),
                _StatItem(label: 'PUSHES', value: '$pushes', color: Colors.grey),
              ],
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: winRate,
              backgroundColor: Colors.grey[800],
              valueColor: const AlwaysStoppedAnimation(Color(0xFFD4A017)),
            ),
            const SizedBox(height: 8),
            Text(
              total > 0 ? '${(winRate * 100).toStringAsFixed(0)}% Win Rate' : 'No picks yet',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
            color: Colors.grey[500],
          ),
        ),
      ],
    );
  }
}
