import { DsSection, StubNote } from '../kit'

/*
  A PREENCHER. Especificação completa em DESIGN.md, seção "Sobreposições e fluxo".
  Use só os primitivos de @/ui e os tokens de src/styles/tokens.css.
  Mantenha o id "sobreposicoes": ele já está registrado no índice (registry.ts).
*/
export default function OverlaySection() {
  return (
    <DsSection id="sobreposicoes" title="Sobreposições e fluxo" intro="Diálogo, gaveta, menu, toast, faixa de aviso, estado vazio, passo a passo, etiqueta Pacote IA e cartão do Copiloto.">
      <StubNote>Seção reservada. Especificação em DESIGN.md, seção "Sobreposições e fluxo".</StubNote>
    </DsSection>
  )
}
