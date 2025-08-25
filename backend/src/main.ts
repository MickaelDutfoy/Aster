import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sessionsRoutes from './routes/sessions';
import membersRoutes from './routes/members';
import organizationsRoutes from './routes/organizations';
import memberOrganizationRoutes from './routes/member_organization';
import animalsRoutes from './routes/animals';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', sessionsRoutes);
app.use('/api', membersRoutes);
app.use('/api', organizationsRoutes);
app.use('/api', memberOrganizationRoutes);
app.use('/api', animalsRoutes);

app.get('/', (req, res) => {
  res.send('Aster API is running 🐾');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});