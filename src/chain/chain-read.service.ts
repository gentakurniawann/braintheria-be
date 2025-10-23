import { Injectable, OnModuleInit } from '@nestjs/common';
import { createPublicClient, http, Address } from 'viem';
import { base } from 'viem/chains';
import { ethers } from 'ethers';
import { QNA_ABI } from './qna.abi';

@Injectable()
export class ChainReadService implements OnModuleInit {
  private client; // viem client (for readContract)
  private provider: ethers.JsonRpcProvider;
  private contract: { address: Address; abi: typeof QNA_ABI };

  constructor() {
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) throw new Error('RPC_URL is missing in .env');

    //viem client (faster for readContract)
    this.client = createPublicClient({
      chain: base, // use Base Sepolia preset (or Base Mainnet if you change RPC)
      transport: http(rpcUrl),
    });

    //thers provider (for getBalance, etc.)
    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    //contract info
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) throw new Error('CONTRACT_ADDRESS missing in .env');

    this.contract = {
      address: contractAddress as Address,
      abi: QNA_ABI,
    } as const;
  }

  //Runs once on boot
  async onModuleInit() {
    const network = await this.provider.getNetwork();
    // console.log(
    //   `[ChainReadService] Connected to network: ${network.name} (chainId=${network.chainId})`,
    // );
  }

  /**
   * Get user's ETH balance (as string, in ETH)
   */
  async getEthBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(`[ChainReadService] Failed to fetch ETH balance:`, error);
      return '0';
    }
  }

  /**
   *Get bounty value for a given question ID from the contract
   */
  async bountyOf(qId: number): Promise<bigint> {
    try {
      const bounty = await this.client.readContract({
        ...this.contract,
        functionName: 'bountyOf',
        args: [BigInt(qId)],
      });
      return bounty as bigint;
    } catch (error) {
      console.error(
        `[ChainReadService] Failed to read bountyOf(${qId}):`,
        error,
      );
      return 0n;
    }
  }

  /**
    Get total number of questions (optional helper)
   */
  async getQuestionCount(): Promise<number> {
    try {
      const count = await this.client.readContract({
        ...this.contract,
        functionName: 'questionCount',
      });
      return Number(count);
    } catch (error) {
      console.error(`[ChainReadService] Failed to read questionCount:`, error);
      return 0;
    }
  }

  /**
   *Get contract’s ETH balance (to monitor bounty pool)
   */
  async getContractBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.contract.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error(
        `[ChainReadService] Failed to fetch contract balance:`,
        error,
      );
      return '0';
    }
  }

  /**
   * Get a single question by ID from the blockchain
   */
  async getQuestion(qId: number) {
    try {
      const q = await this.client.readContract({
        ...this.contract,
        functionName: 'getQuestion',
        args: [BigInt(qId)],
      });

      // q is a tuple matching your Solidity struct Question
      return {
        id: qId,
        asker: q[0],
        token: q[1],
        bounty: ethers.formatEther(q[2]),
        deadline: Number(q[3]),
        uri: q[4],
        answered: q[5],
      };
    } catch (error) {
      console.error(
        `[ChainReadService] Failed to read getQuestion(${qId}):`,
        error,
      );
      return null;
    }
  }

  /**
   * List all on-chain questions (1..questionCount)
   */
  async listAllQuestions(): Promise<
    {
      id: number;
      asker: string;
      token: string;
      bounty: string;
      deadline: number;
      uri: string;
      answered: boolean;
    }[]
  > {
    const total = await this.getQuestionCount();

    const result: {
      id: number;
      asker: string;
      token: string;
      bounty: string;
      deadline: number;
      uri: string;
      answered: boolean;
    }[] = [];

    for (let i = 1; i <= total; i++) {
      const q = await this.getQuestion(i);
      if (q) result.push(q);
    }
    return result;
  }
}
