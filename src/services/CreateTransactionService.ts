import AppError from '../errors/AppError';
import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string
}

class CreateTransactionService {
  public async execute(dados: RequestDTO): Promise<Transaction> {

    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionRepository.getBalance();

    if (total < dados.value && dados.type === 'outcome') {
      throw new AppError('You do not have enough balance');
    }

    let transactionCategory = await categoryRepository.findOne({ where: { title: dados.category } });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: dados.category
      });
      await categoryRepository.save(transactionCategory);
    }

    const transaction = transactionRepository.create({
      title: dados.title,
      value: dados.value,
      type: dados.type,
      category: transactionCategory
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
