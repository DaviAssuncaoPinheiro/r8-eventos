import { DsSection, StubNote } from '../kit'

/*
  A PREENCHER. Especificação completa em DESIGN.md, seção "Casca".
  Use só os primitivos de @/ui e os tokens de src/styles/tokens.css.
  Mantenha o id "casca": ele já está registrado no índice (registry.ts).
*/
export default function ShellSection() {
  return (
    <DsSection id="casca" title="Casca" intro="Item da navegação lateral, topo, navegação inferior do celular, botões grandes do app de campo e faixa Ambiente de demonstração.">
      <StubNote>Seção reservada. Especificação em DESIGN.md, seção "Casca".</StubNote>
    </DsSection>
  )
}
