import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useTheme } from '../context/ThemeContext.jsx'

function Home() {
  const { theme } = useTheme()
  
  useEffect(() => {
    // Inicializar Bootstrap JS para los accordions
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section text-center home-hero">
        <div className="container">
          <h1 className="display-2 fw-bold mb-4">NOM-035-STPS-2018</h1>
          <p className="lead fs-3 mb-4">Factores de riesgo psicosocial en el trabajo</p>
          <p className="fs-5 mb-4">Identificación, análisis y prevención</p>
          <a href="#que-es" className="btn btn-light btn-lg mt-4 px-5 py-3 fs-4">Conoce más</a>
        </div>
      </section>

      {/* Qué es la NOM-035 */}
      <section id="que-es" className="container mb-5 py-5 home-section">
        <div className="row">
          <div className="col-lg-10 mx-auto">
            <h2 className="text-center mb-5 home-title">¿Qué es la NOM-035?</h2>
            <div className="row mb-5">
              <div className="col-lg-10 mx-auto">
                <p className="lead fs-4 mb-4 text-center">La Norma Oficial Mexicana NOM-035-STPS-2018 es una regulación emitida por la Secretaría del Trabajo y Previsión Social (STPS) que establece los elementos para identificar, analizar y prevenir los factores de riesgo psicosocial en los centros de trabajo, así como para promover un entorno organizacional favorable.</p>
                <p className="fs-5 text-center mb-5">Esta norma entró en vigor el 23 de octubre de 2018 y su implementación se realizó de manera gradual:</p>
              </div>
            </div>
            
            <div className="row mt-5 g-4">
              <div className="col-lg-4 mb-4">
                <div className="card h-100 home-card">
                  <div className="card-body p-4">
                    <h4 className="card-title mb-3">Primera etapa</h4>
                    <p className="card-text fs-5">A partir del 23 de octubre de 2019 para empresas con más de 50 trabajadores.</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 mb-4">
                <div className="card h-100 home-card">
                  <div className="card-body p-4">
                    <h4 className="card-title mb-3">Segunda etapa</h4>
                    <p className="card-text fs-5">A partir del 23 de octubre de 2020 para todas las empresas, independientemente de su tamaño.</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 mb-4">
                <div className="card h-100 home-card">
                  <div className="card-body p-4">
                    <h4 className="card-title mb-3">Aplicación</h4>
                    <p className="card-text fs-5">Obligatoria para todos los centros de trabajo en México, incluyendo sector público y privado.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Objetivo */}
      <section 
        id="objetivo" 
        className="bg-light py-5 home-section"
        style={theme === 'dark' ? {
          backgroundColor: '#2d2d2d',
          color: '#ffffff'
        } : {}}
      >
        <div className="container">
          <div className="row">
            <div className="col-lg-10 mx-auto">
              <h2 className="text-center mb-5 home-title">Objetivo de la NOM-035</h2>
              <p className="fs-4 text-center mb-5">La norma busca establecer los elementos para identificar, analizar y prevenir los factores de riesgo psicosocial, así como para promover un entorno organizacional favorable en los centros de trabajo.</p>
              
              <div className="row g-4 mt-4">
                <div className="col-lg-6">
                  <div className="card h-100 home-card">
                    <div className="card-header bg-primary text-white">
                      <h4 className="mb-0">Factores de riesgo psicosocial</h4>
                    </div>
                    <div className="card-body p-4">
                      <p className="fs-5 mb-3">Identificar condiciones peligrosas en el trabajo que pueden provocar trastornos de ansiedad, estrés laboral o alteraciones del sueño.</p>
                      <ul className="fs-5">
                        <li className="mb-2">Cargas de trabajo excesivas</li>
                        <li className="mb-2">Jornadas laborales extendidas</li>
                        <li className="mb-2">Falta de control sobre el trabajo</li>
                        <li className="mb-2">Relaciones laborales negativas</li>
                        <li className="mb-2">Violencia laboral</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="card h-100 home-card">
                    <div className="card-header bg-success text-white">
                      <h4 className="mb-0">Entorno organizacional favorable</h4>
                    </div>
                    <div className="card-body p-4">
                      <p className="fs-5 mb-3">Promover condiciones que favorezcan el desarrollo de los trabajadores y la productividad:</p>
                      <ul className="fs-5">
                        <li className="mb-2">Claridad en funciones y responsabilidades</li>
                        <li className="mb-2">Participación en la toma de decisiones</li>
                        <li className="mb-2">Reconocimiento del desempeño</li>
                        <li className="mb-2">Respeto y equidad</li>
                        <li className="mb-2">Balance vida-trabajo</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protección de datos */}
      <section id="proteccion" className="data-protection home-section">
        <div className="container">
          <h2 className="text-center mb-5 home-title">Protección de Datos en la NOM-035</h2>
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card h-100 home-card">
                <div className="card-body p-4">
                  <h4 className="card-title mb-3"><i className="bi bi-shield-lock me-2"></i> Confidencialidad</h4>
                  <p className="card-text fs-5 mb-3">La NOM-035 establece que toda la información obtenida a través de los cuestionarios y evaluaciones debe ser manejada con estricta confidencialidad.</p>
                  <ul className="fs-5">
                    <li className="mb-2">Los resultados individuales no pueden ser compartidos con superiores jerárquicos</li>
                    <li className="mb-2">Solo personal autorizado puede acceder a los datos</li>
                    <li className="mb-2">Los datos deben ser anonimizados para análisis grupales</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="card h-100 home-card">
                <div className="card-body p-4">
                  <h4 className="card-title mb-3"><i className="bi bi-file-earmark-lock2 me-2"></i> Cumplimiento con la LFPDPPP</h4>
                  <p className="card-text fs-5 mb-3">El tratamiento de datos personales debe cumplir con la Ley Federal de Protección de Datos Personales en Posesión de Particulares (LFPDPPP).</p>
                  <ul className="fs-5">
                    <li className="mb-2">Se debe obtener consentimiento informado de los trabajadores</li>
                    <li className="mb-2">Los datos deben ser utilizados únicamente para los fines establecidos</li>
                    <li className="mb-2">Se deben implementar medidas de seguridad adecuadas</li>
                    <li className="mb-2">Los trabajadores tienen derecho a acceder, rectificar y cancelar sus datos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row mt-5">
            <div className="col-lg-10 mx-auto">
              <div className="alert alert-info mt-4 p-4">
                <h4 className="mb-3"><i className="bi bi-exclamation-triangle me-2"></i> Consideraciones importantes</h4>
                <p className="fs-5 mb-3">Los empleadores deben garantizar que la implementación de la NOM-035 no vulnere los derechos de privacidad de los trabajadores. Los cuestionarios no deben contener preguntas invasivas o que recaben información sensible (ideología, religión, preferencias sexuales, etc.).</p>
                <p className="fs-5 mb-0">Los datos recabados deben ser almacenados de forma segura y eliminados una vez cumplido su propósito, salvo que exista una obligación legal de conservarlos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Implementación */}
      <section id="implementacion" className="container py-5 home-section">
        <h2 className="text-center mb-5 home-title">Implementación de la NOM-035</h2>
        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card h-100 home-card">
              <div className="card-body p-4">
                <h4 className="mb-4">Pasos para cumplir con la norma:</h4>
                <ol className="list-group list-group-numbered">
                  <li className="list-group-item fs-5 py-3">Realizar una política de prevención de riesgos psicosociales</li>
                  <li className="list-group-item fs-5 py-3">Identificar y analizar factores de riesgo psicosocial</li>
                  <li className="list-group-item fs-5 py-3">Evaluar a los trabajadores (cuando aplique)</li>
                  <li className="list-group-item fs-5 py-3">Implementar medidas de control y prevención</li>
                  <li className="list-group-item fs-5 py-3">Capacitar a los trabajadores</li>
                  <li className="list-group-item fs-5 py-3">Dar seguimiento a las medidas implementadas</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="card h-100 home-card">
              <div className="card-body p-4">
                <h4 className="card-title mb-3">Sanciones por incumplimiento</h4>
                <p className="card-text fs-5 mb-3">El no cumplimiento con la NOM-035 puede derivar en sanciones por parte de la STPS:</p>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th className="fs-5">Infracción</th>
                        <th className="fs-5">Sanción (UMA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fs-5">No implementar la política</td>
                        <td className="fs-5">250 a 2,500</td>
                      </tr>
                      <tr>
                        <td className="fs-5">No realizar evaluaciones</td>
                        <td className="fs-5">250 a 5,000</td>
                      </tr>
                      <tr>
                        <td className="fs-5">No atender casos de violencia</td>
                        <td className="fs-5">500 a 5,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-muted mt-3 fs-5"><small>* UMA = Unidad de Medida y Actualización (valor aproximado en 2023: $103.74 MXN)</small></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Registro */}
      <section id="registro" className="py-5 bg-primary text-white home-cta" style={{background: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)'}}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="display-4 fw-bold mb-4">¡Implementa la NOM-035 en tu empresa!</h2>
              <p className="lead fs-3 mb-5">Cumple con la normativa y protege el bienestar de tus colaboradores</p>
              
              <Link to="/intermedio" className="btn btn-light btn-lg px-5 py-4 fs-3 fw-bold shadow-lg mb-4" style={{borderRadius: '50px'}}>
                <i className="bi bi-building-check me-2"></i>Iniciar
              </Link>
              
              <div className="mt-5">
                <p className="fs-4 mb-3">Proceso 100% seguro y confidencial</p>
                <div className="mt-3">
                  <i className="bi bi-shield-lock fs-2 me-3"></i>
                  <i className="bi bi-file-earmark-lock fs-2 me-3"></i>
                  <i className="bi bi-person-check fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Home

