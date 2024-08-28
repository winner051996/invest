import React from 'react';
import { Button, Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setCompaniesData, setHeaders, filterCompanies } from './store/companiesSlice';
import * as XLSX from 'xlsx';

function ExcelParser() {
  const dispatch = useDispatch();
  const { companiesData, headers } = useSelector((state) => state.companies);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const newHeaders = jsonData[1].slice(0, 8);
      newHeaders.push('Прибыль');
      dispatch(setHeaders(newHeaders));

      const parsedData = [];

      for (let i = 0; i < jsonData[0].length; i += 8) {
        let companyName = jsonData[0][i];
        let ticker = jsonData[2][i + 7];

        if (companyName) {
          let companyData = {
            name: `${companyName} (${ticker})`,
            ticker: ticker,
            rows: [],
          };

          for (let j = 2; j < jsonData.length; j++) {
            let row = jsonData[j].slice(i, i + 8);
            if (row.some((cell) => cell !== undefined && cell !== null)) {
              companyData.rows.push(row);
            }
          }

          parsedData.push(companyData);
        }
      }

      fetchTickerPrices(parsedData);
    };

    reader.readAsArrayBuffer(file);
  };

  const fetchTickerPrices = (data) => {
    const promises = data.map((company) => {
      const url = `https://iss.moex.com/iss/engines/stock/markets/shares/securities/${company.ticker}.json`;

      return fetch(url)
        .then((response) => response.json())
        .then((json) => {
          const price = json.marketdata.data[0][2];
          company.price = price;

          company.rows = company.rows.map((row) => {
            const quantity = parseFloat(row[2]);
            const sum = parseFloat(row[4]);
            const profit = (quantity * price) - sum;
            return [...row, profit];
          });
        })
        .catch((error) => {
          console.error(`Ошибка при получении данных для тикера ${company.ticker}:`, error);
          company.price = 'N/A';
          company.rows = company.rows.map((row) => [...row, 'N/A']);
        });
    });

    Promise.all(promises).then(() => {
      dispatch(setCompaniesData(data));
    });
  };

  const handleFilter = () => {
    dispatch(filterCompanies());
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Загрузите Excel-файл
      </Typography>

      <input
        accept=".xlsx, .xls"
        id="file-upload"
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <label htmlFor="file-upload">
        <Button variant="contained" component="span" color="primary">
          Загрузить и Парсить
        </Button>
      </label>
      <Button variant="contained" color="secondary" onClick={handleFilter} style={{ marginLeft: 10 }}>
        Фильтр "Пары продаж" (без значения)
      </Button>

      <div style={{ marginTop: 20 }}>
        {companiesData.map((company) => (
          <div key={company.name}>
            <Typography variant="h5" gutterBottom>
              Компания: {company.name}, Цена: {company.price}
            </Typography>
            <TableContainer component={Paper} style={{ marginBottom: 20 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableCell key={index} align="center">
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {company.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          align="center"
                          className={
                            cellIndex === row.length - 1
                              ? cell > 0
                                ? 'profit-positive'
                                : 'profit-negative'
                              : ''
                          }
                        >
                          {cell !== undefined && typeof cell === 'number' ? cell.toFixed(2) : cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ))}
      </div>
    </Container>
  );
}

export default ExcelParser;
