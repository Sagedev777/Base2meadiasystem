const { z } = require('zod');
const schema = z.string().email().optional().or(z.literal(''));
console.log(schema.safeParse(""));
console.log(schema.safeParse(undefined));
console.log(schema.safeParse("test@example.com"));
