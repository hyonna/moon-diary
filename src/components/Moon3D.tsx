'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { MoonPhase, MOOD_MAPPINGS } from '@/types/diary'

interface Moon3DProps {
  moodCounts: Record<MoonPhase, number>
  totalEntries: number
}

// 달 위상 계산 함수
function calculateMoonPhase(moodCounts: Record<MoonPhase, number>, total: number): number {
  if (total === 0) return 0

  // 각 감정의 비율에 따라 달의 위상 결정
  // 신월(0) -> 상현달(0.25) -> 보름달(0.5) -> 하현달(0.75) -> 신월(1)
  const phaseWeights = {
    new: 0, // 신월
    waxing: 0.25, // 상현달
    full: 0.5, // 보름달
    waning: 0.75 // 하현달
  }

  let weightedPhase = 0
  Object.entries(moodCounts).forEach(([mood, count]) => {
    const ratio = count / total
    weightedPhase += ratio * phaseWeights[mood as MoonPhase]
  })

  return weightedPhase
}

// 달 메시 컴포넌트
function MoonMesh({ phase }: { phase: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  // 달 텍스처 로드 (원본 코드 참고)
  const textureURL = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg'
  const displacementURL = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/ldem_3_8bit.jpg'

  const [texture, displacementMap] = useTexture([textureURL, displacementURL])

  useFrame((state, delta) => {
    if (meshRef.current) {
      // 회전 속도 느리게 조정
      meshRef.current.rotation.y += delta * 0.15
      meshRef.current.rotation.x += delta * 0.003
    }
  })

  // 달의 위상 각도 (위상에 따라 회전)
  const rotationAngle = useMemo(() => {
    // phase: 0 (신월) -> 0도, 0.25 (상현달) -> -90도, 0.5 (보름달) -> -180도
    return phase * Math.PI * 2 - Math.PI / 2
  }, [phase])

  // 위상에 따른 X축 스케일 (위상 표현)
  const phaseScale = useMemo(() => {
    if (phase <= 0.25) {
      // 신월 -> 상현달: 0 -> 1
      return phase * 4
    } else if (phase <= 0.5) {
      // 상현달 -> 보름달: 1 유지
      return 1
    } else if (phase <= 0.75) {
      // 보름달 -> 하현달: 1 유지
      return 1
    } else {
      // 하현달 -> 신월: 1 -> 0
      return (1 - phase) * 4
    }
  }, [phase])

  return (
    <group rotation={[0, rotationAngle, 0]}>
      {/* 메인 달 구체 - 실제 달 텍스처 사용 (원본 코드 참고) */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 60, 60]} />
        <meshPhongMaterial
          color={0xffffff}
          map={texture}
          displacementMap={displacementMap}
          displacementScale={0.06}
          bumpMap={displacementMap}
          bumpScale={0.04}
          shininess={0}
          reflectivity={0}
        />
      </mesh>

      {/* 달의 위상 표현을 위한 어두운 반구 (위상에 따라 크기 조절) */}
      {phaseScale > 0 && phaseScale < 1 && (
        <mesh>
          <sphereGeometry args={[1.02, 60, 60]} />
          <meshStandardMaterial color="#000000" opacity={0.95} transparent />
        </mesh>
      )}
    </group>
  )
}

// 우주 배경 컴포넌트
function SpaceBackground() {
  const worldURL = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/hipp8_s.jpg'
  const worldTexture = useTexture(worldURL)
  const worldRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (worldRef.current) {
      // 우주 배경 회전 속도 느리게 조정
      worldRef.current.rotation.y += delta * 0.005
      worldRef.current.rotation.x += delta * 0.02
    }
  })

  return (
    <mesh ref={worldRef}>
      <sphereGeometry args={[1000, 60, 60]} />
      <meshBasicMaterial map={worldTexture} side={THREE.BackSide} />
    </mesh>
  )
}

export default function Moon3D({ moodCounts, totalEntries }: Moon3DProps) {
  const moonPhase = useMemo(() => {
    return calculateMoonPhase(moodCounts, totalEntries)
  }, [moodCounts, totalEntries])

  // 가장 많이 기록된 감정
  const dominantMood = useMemo(() => {
    const maxCount = Math.max(...Object.values(moodCounts))
    return Object.entries(moodCounts).find(([, count]) => count === maxCount)?.[0] as MoonPhase | undefined
  }, [moodCounts])

  const dominantMoodName = dominantMood ? MOOD_MAPPINGS[dominantMood].name : ''

  // 달 위상에 따른 조명 위치 계산
  // phase: 0 (신월) -> 0.5 (보름달) -> 1 (신월)
  // 신월(0): 태양이 달 뒤에 있음 → 조명이 뒤에서 (z축 음수)
  // 상현달(0.25): 오른쪽 절반이 밝음 → 조명이 오른쪽에서 (x축 양수)
  // 보름달(0.5): 전체가 밝음 → 조명이 앞에서 (z축 양수)
  // 하현달(0.75): 왼쪽 절반이 밝음 → 조명이 왼쪽에서 (x축 음수)
  const lightPosition = useMemo(() => {
    // 위상에 따라 태양의 위치를 계산
    // 위상을 0~2π 각도로 변환 (신월: -90도, 상현달: 0도, 보름달: 90도, 하현달: 180도)
    const angle = moonPhase * Math.PI * 2 - Math.PI / 2
    const distance = 100
    const x = Math.cos(angle) * distance
    const z = Math.sin(angle) * distance
    const y = 10 // 약간 위쪽
    return [x, y, z] as [number, number, number]
  }, [moonPhase])

  // 조명 강도도 위상에 따라 조정
  // 신월(0, 1): 어둡게, 보름달(0.5): 밝게
  const lightIntensity = useMemo(() => {
    // 위상이 0.5 (보름달)에 가까울수록 밝게
    const distanceFromFull = Math.abs(moonPhase - 0.5) * 2 // 0 ~ 1
    return 0.3 + (1 - distanceFromFull) * 0.7 // 0.3 ~ 1.0
  }, [moonPhase])

  // Hemisphere Light 색상 (원본 코드 참고)
  const hemiLightColor = useMemo(() => {
    const color = new THREE.Color()
    color.setHSL(0.6, 1, 0.6)
    return color
  }, [])

  const hemiGroundColor = useMemo(() => {
    const color = new THREE.Color()
    color.setHSL(0.095, 1, 0.75)
    return color
  }, [])

  return (
    <div className="w-full h-64 bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        {/* 우주 배경 */}
        <SpaceBackground />

        {/* 조명 - 위상에 따라 위치와 강도 조정 */}
        <directionalLight color={0xffffff} intensity={lightIntensity} position={lightPosition} />
        <hemisphereLight
          color={hemiLightColor}
          groundColor={hemiGroundColor}
          intensity={0.1 + (lightIntensity - 0.3) * 0.2}
          position={[0, 0, 0]}
        />

        {/* 달 메시 */}
        <MoonMesh phase={moonPhase} />

        {/* 카메라 컨트롤 - 자동 회전 속도 조정 */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.8}
          rotateSpeed={1.0}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
      <div className="text-center mt-2">
        <p className="text-xs text-[var(--text-secondary)]">평균 감정: {dominantMoodName || '없음'}</p>
      </div>
    </div>
  )
}
