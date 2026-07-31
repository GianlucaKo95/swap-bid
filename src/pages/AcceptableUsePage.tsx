export default function AcceptableUsePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nutzungsbedingungen</h1>
      <p className="text-gray-700">
        SwapBid ist eine private Tauschbörse: Du postest einen Geldbetrag, andere bieten dir dafür ein
        Objekt an. Damit das für alle sicher bleibt, ist Folgendes bei Gesuchen und Angeboten{' '}
        <strong>strikt verboten</strong>:
      </p>
      <ul className="list-disc pl-6 text-gray-700 space-y-1">
        <li>Sexuelle Inhalte oder sexuelle Dienstleistungen jeder Art</li>
        <li>Inhalte, die Minderjährige sexualisieren</li>
        <li>Menschenhandel, Zwangsarbeit oder jede Form der Ausbeutung von Menschen</li>
        <li>Waffen, Munition, Drogen oder andere illegale Güter</li>
        <li>Gestohlene Ware oder Falschgeld</li>
        <li>Alles, was nach geltendem Recht (insbesondere deutschem Recht) illegal ist</li>
      </ul>
      <p className="text-gray-700 mt-4">
        Verstöße werden serverseitig automatisch geprüft und können zusätzlich über den{' '}
        <strong>„Melden“</strong>-Button bei jedem Gesuch und Angebot gemeldet werden. Der Betrieb
        behält sich vor, Inhalte ohne Vorankündigung zu entfernen und Konten zu sperren. Bei
        begründetem Verdacht auf schwere Straftaten (z. B. Menschenhandel, sexualisierte Gewalt gegen
        Minderjährige) werden Strafverfolgungsbehörden eingeschaltet.
      </p>
    </div>
  )
}
