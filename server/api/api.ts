import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger-output.json';
import pool from '../db/dbConfig';
import { createUser, signIn, checkPassword } from './users/userService';
import { User } from './users/userModels';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/api/statistics', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM statistics');
    const femaleLifeExpectancy = result.rows.map((row) => ({
      country: row.country,
      life_expectancy: row.women,
    }));
    const maleLifeExpectancy = result.rows.map((row) => ({
      country: row.country,
      life_expectancy: row.men,
    }));

    res.json({
      femaleLifeExpectancy,
      maleLifeExpectancy,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.post('/api/signup', async (req: Request, res: Response) => {
  try {
    const user: User = {
      prenom: req.body.prenom,
      nom: req.body.nom,
      email: req.body.email,
      password: req.body.mot_de_passe,
    };

    await createUser(user);
    res.status(200).send('Utilisateur ajouté ! ');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.post('/api/signin', async (req: Request, res: Response) => {
  try {
    const connected = await signIn(req.body.email, req.body.mot_de_passe);

    if (connected.success) {
      res.status(200).json({ accessToken: connected.accessToken });
    } else {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});

app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM utilisateur');
    const users = result.rows.map((row) => ({
      nom: row.nom,
      prenom: row.prenom,
    }));
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.post('/api/check-password', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const match = await checkPassword(email, password);

    res.json({ match });
  } catch (error) {
    res.status(500).send('Server error');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
