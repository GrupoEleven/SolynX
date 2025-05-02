import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
    getAccount,
    getMint
} from "@solana/spl-token";
import { useState } from "react";

// Constants
const TOKEN_MINT = new PublicKey("5qCSfbTAtLCm9oZT4hYH2s4LGG8JzAaZXPF1TSfYpPn8");
const TOKEN_AUTHORITY = new PublicKey("ACF5o8USHkcexBrbuTL1KFsDhL44qyC3a9L1euW23hGP");
const TOKEN_ACCOUNT = new PublicKey("8UVo57rcaCYpntfEVUWwcsXnuT7Kto4mJ3X5qGkbmq6");

const TokenAccount = () => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState("");

    const createTokenAccount = async () => {
        if (!publicKey) {
            setStatus("Por favor, conecte sua carteira primeiro");
            return;
        }

        setIsLoading(true);
        setStatus("Criando conta de token...");

        try {
            const { blockhash } = await connection.getLatestBlockhash("confirmed");
            const buyerATA = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);

            const transaction = new Transaction();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            try {
                await getAccount(connection, buyerATA);
                setStatus("Conta de token já existe!");
            } catch {
                console.log("Criando nova conta associada...");
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        buyerATA,
                        publicKey,
                        TOKEN_MINT
                    )
                );

                const signature = await sendTransaction(transaction, connection);
                await connection.confirmTransaction(signature, "confirmed");
                setStatus("Conta de token criada com sucesso!");
            }

        } catch (error) {
            console.error("Erro ao criar conta de token:", error);
            setStatus(`Erro: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const checkTokenBalance = async () => {
        if (!publicKey) return;

        try {
            setStatus("Verificando saldo...");
            const buyerATA = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);
            try {
                const account = await getAccount(connection, buyerATA);
                const mintInfo = await getMint(connection, TOKEN_MINT);
                const balance = Number(account.amount) / Math.pow(10, mintInfo.decimals);
                setStatus(`Saldo atual: ${balance} tokens`);
                return balance;
            } catch (error) {
                setStatus("Conta de token não encontrada");
                return 0;
            }

        } catch (error) {
            console.error("Erro ao verificar saldo:", error);
            setStatus(`Erro: ${error.message}`);
            return 0;
        }
    };

    const buyTokens = async (amount: number) => {
        if (!publicKey) {
            setStatus("Por favor, conecte sua carteira primeiro");
            return;
        }

        setIsLoading(true);
        setStatus("Iniciando compra...");

        try {
            const { blockhash } = await connection.getLatestBlockhash("confirmed");
            const buyerATA = await getAssociatedTokenAddress(TOKEN_MINT, publicKey);
            const transaction = new Transaction();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            try {
                await getAccount(connection, buyerATA);
            } catch {
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey,
                        buyerATA,
                        publicKey,
                        TOKEN_MINT
                    )
                );
            }

            const transferAmount = BigInt(amount * Math.pow(10, 9));

            const transferInstruction = createTransferInstruction(
                TOKEN_ACCOUNT,
                buyerATA,
                TOKEN_AUTHORITY,
                transferAmount
            );

            transaction.add(transferInstruction);

            setStatus("Enviando transação...");
            const signature = await sendTransaction(transaction, connection);

            setStatus("Aguardando confirmação...");
            await connection.confirmTransaction(signature, "confirmed");

            setStatus("Compra realizada com sucesso!");
            await checkTokenBalance();

        } catch (error) {
            console.error("Erro ao comprar tokens:", error);
            setStatus(`Erro: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="token-account">
            <div className="status-message">{status}</div>
            <button
                onClick={createTokenAccount}
                disabled={isLoading || !publicKey}
            >
                {isLoading ? "Processando..." : "Criar Conta de Token"}
            </button>
            <button
                onClick={checkTokenBalance}
                disabled={!publicKey}
            >
                Verificar Saldo
            </button>
            <button
                onClick={() => buyTokens(1)}
                disabled={isLoading || !publicKey}
            >
                {isLoading ? "Processando..." : "Comprar Tokens"}
            </button>
        </div>
    );
};

export default TokenAccount;

