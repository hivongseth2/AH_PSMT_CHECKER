import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'

const ResultDisplay = ({ results, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            <p className="mt-4 text-gray-600">Đang xử lý dữ liệu...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!results) return null

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Kết Quả Kiểm Tra</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loại</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Thông tin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result, index) => (
              <TableRow key={index}>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.type === 'error' ? 'bg-red-100 text-red-800' : 
                    result.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {result.type}
                  </span>
                </TableCell>
                <TableCell>{result.title}</TableCell>
                <TableCell>{result.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default ResultDisplay

