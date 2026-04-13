/*
  Warnings:

  - You are about to drop the column `centroCusto` on the `Usuario` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Usuario" DROP COLUMN "centroCusto",
ADD COLUMN     "centrosCusto" TEXT[];
