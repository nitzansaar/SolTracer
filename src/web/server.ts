import express, { Request, Response, RequestHandler } from 'express';
import http from 'http';
import path from 'path';
import { VERSION } from '../index';
import { TransactionSimulator } from '../core/simulator';
import chalk from 'chalk';
import figlet from 'figlet';

/**
 * A simple web server for SolTrace
 */
export class SolTraceServer {
  private app: express.Application;
  private server: http.Server;
  private port: number;

  /**
   * Create a new SolTrace web server
   * @param port The port to listen on
   */
  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.configureApp();
  }

  /**
   * Configure the Express application
   */
  private configureApp(): void {
    // Serve static files from the 'public' directory
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Configure API routes
    this.configureRoutes();
    
    // Catch-all route to serve the main UI
    this.app.get('*', ((req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }) as RequestHandler);
  }

  /**
   * Configure API routes
   */
  private configureRoutes(): void {
    // API route to get version information
    this.app.get('/api/info', ((req: Request, res: Response) => {
      res.json({
        name: 'SolTrace',
        version: VERSION,
      });
    }) as RequestHandler);
    
    // API route to debug a transaction
    this.app.post('/api/debug/tx', (async (req: Request, res: Response) => {
      try {
        const { signature, rpcUrl, options } = req.body;
        
        if (!signature) {
          return res.status(400).json({ error: 'Transaction signature is required' });
        }
        
        const simulator = new TransactionSimulator(rpcUrl || 'https://api.devnet.solana.com');
        const result = await simulator.debugSignature(signature, options || {});
        
        res.json(result);
      } catch (error: any) {
        console.error('Error debugging transaction:', error);
        res.status(500).json({ error: error.message || 'An error occurred' });
      }
    }) as RequestHandler);
  }

  /**
   * Start the server
   */
  public start(): void {
    // Create 'public' directory if it doesn't exist
    const publicDir = path.join(__dirname, 'public');
    
    this.server.listen(this.port, () => {
      console.log(chalk.yellow(figlet.textSync('SolTrace', { horizontalLayout: 'full' })));
      console.log(chalk.cyan(`SolTrace Web v${VERSION} - Solana transaction debugger`));
      console.log(chalk.green(`Server running at http://localhost:${this.port}`));
      console.log(chalk.yellow('Press Ctrl+C to stop the server'));
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new SolTraceServer();
  server.start();
} 