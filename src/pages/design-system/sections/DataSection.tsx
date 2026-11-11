import { DsSection, StubNote } from '../kit'

/*
  A PREENCHER. Especificação completa em DESIGN.md, seção "Dados".
  Use só os primitivos de @/ui e os tokens de src/styles/tokens.css.
  Mantenha o id "dados": ele já está registrado no índice (registry.ts).
*/
export default function DataSection() {
  return (
    <DsSection id="dados" title="Dados" intro="Tabela, linha de serviço, gráficos, linha do tempo do dossiê, foto e QR.">
      <StubNote>Seção reservada. Especificação em DESIGN.md, seção "Dados".</StubNote>
    </DsSection>
  )
}
