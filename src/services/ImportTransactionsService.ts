import { getCustomRepository, getRepository, In } from 'typeorm';
import csvparse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface LineCSVDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}


class ImportTransactionsService {

  async execute(filePath: string): Promise<Transaction[]> {
    const contactsReadStream = fs.createReadStream(filePath);
    const parsers = csvparse({
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions: Array<LineCSVDTO> = [];
    const categories: Array<string> = [];
    const transactionsRepository = getRepository(Transaction);
    const categoriesRepository = getRepository(Category);

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim());

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existentCategories = await categoriesRepository.find({ where: { title: In(categories) } });
    const existentCategoriesTitle = existentCategories.map((category: Category) => category.title);
    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(item => ({
          title: item.title,
          value: item.value,
          type: item.type,
          category: finalCategories.find(category => category.title === item.category)
        }))
    )

    await transactionsRepository.save(createdTransactions);
    await fs.promises.unlink(filePath);

    return createdTransactions;

  }
}

export default ImportTransactionsService;
