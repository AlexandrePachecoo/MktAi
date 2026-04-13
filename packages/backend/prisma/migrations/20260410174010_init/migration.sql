-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hash_pass" TEXT NOT NULL,
    "plano" TEXT NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campanha" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "publico_alvo" TEXT NOT NULL,
    "orcamento" DOUBLE PRECISION NOT NULL,
    "plataforma" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativa',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campanha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criativo" (
    "id" TEXT NOT NULL,
    "campanha_id" TEXT NOT NULL,
    "url_imagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Criativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TesteAB" (
    "id" TEXT NOT NULL,
    "campanha_id" TEXT NOT NULL,
    "criativo_id_a" TEXT NOT NULL,
    "criativo_id_b" TEXT NOT NULL,
    "resultado" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',

    CONSTRAINT "TesteAB_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integracao" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "Integracao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Campanha" ADD CONSTRAINT "Campanha_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Criativo" ADD CONSTRAINT "Criativo_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "Campanha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TesteAB" ADD CONSTRAINT "TesteAB_campanha_id_fkey" FOREIGN KEY ("campanha_id") REFERENCES "Campanha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TesteAB" ADD CONSTRAINT "TesteAB_criativo_id_a_fkey" FOREIGN KEY ("criativo_id_a") REFERENCES "Criativo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TesteAB" ADD CONSTRAINT "TesteAB_criativo_id_b_fkey" FOREIGN KEY ("criativo_id_b") REFERENCES "Criativo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integracao" ADD CONSTRAINT "Integracao_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
