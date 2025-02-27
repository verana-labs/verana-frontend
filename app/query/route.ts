import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function listInvoices() {
	const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

	return data;
}

async function listRevenue() {
	const data = await sql`SELECT * FROM revenue`;
  return data;
}

async function lisLatestInvoices() {
	const data = await sql`SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;
  return data;
}


export async function GET() {
  // return Response.json({
  //   message:
  //     'Uncomment this file and remove this line. You can delete this file when you are finished.',
  // });
  try {
  	// return Response.json(await listInvoices());
    // return Response.json(await listRevenue());
    return Response.json(await lisLatestInvoices());
  } catch (error) {
  	return Response.json({ error }, { status: 500 });
  }
}
