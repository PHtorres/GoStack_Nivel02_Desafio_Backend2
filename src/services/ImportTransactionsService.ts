import csvparse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';

interface LineCSVDTO {
  title: string;
  type: string;
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

    const transactions = new Array<LineCSVDTO>();
    const categories = new Array<string>();

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim());

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    console.log(transactions);
    console.log(categories);

    return new Array<Transaction>();

  }
}

export default ImportTransactionsService;
