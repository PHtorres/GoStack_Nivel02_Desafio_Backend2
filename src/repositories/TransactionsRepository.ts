import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {

  public async getBalance(): Promise<Balance> {

    const transactions = await this.find();
    const balance = transactions.reduce((accumulator, transaction) => {
      switch (transaction.type) {
        case 'income':
          accumulator.income = accumulator.income + Number(transaction.value);
          break;
        case 'outcome':
          accumulator.outcome = accumulator.outcome + Number(transaction.value);
          break;
      }

      return accumulator;
    }, {
      income: 0,
      outcome: 0,
      total: 0
    });

    const total = balance.income - balance.outcome;

    return { income: balance.income, outcome: balance.outcome, total };

  }
}

export default TransactionsRepository;