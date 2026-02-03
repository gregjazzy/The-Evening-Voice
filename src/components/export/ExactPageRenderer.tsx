/**
 * Rendu EXACT d'une page de livre pour l'export PDF.
 *
 * Utilise les mêmes formules partagées que BookMode via pageRendering.ts.
 * Pas d'éléments interactifs, pas de translate(-50%, -50%) sur les images/textboxes.
 */

'use client'

import React from 'react'
import type { StoryPage, PageMedia, PageDecoration, PageTextBox } from '@/store/useAppStore'
import { PREMIUM_DECORATIONS } from '@/data/decorations'
import {
  getPageScale,
  getScaledFontSize,
  getScaledLineHeightPx,
  DECORATION_BASE_SIZE,
  PAGE_PADDING,
} from '@/lib/rendering/pageRendering'
import type { LineSpacing } from '@/lib/rendering/pageRendering'

type PageColor = 'cream' | 'white' | 'aged' | 'parchment' | 'blue' | 'pink' | 'mint' | 'lavender' | 'peach' | 'sky'

interface TextStyle {
  fontFamily?: string
  fontSize?: number
  color?: string
  isBold?: boolean
  isItalic?: boolean
  textAlign?: 'left' | 'center' | 'right'
  lineSpacing?: 'tight' | 'normal' | 'relaxed'
}

const PAGE_COLORS: { id: PageColor; bg: string; gradient: string }[] = [
  { id: 'cream', bg: 'bg-amber-50', gradient: 'linear-gradient(225deg, #fef9f0 0%, #fdf6e8 50%, #fbf2df 100%)' },
  { id: 'white', bg: 'bg-white', gradient: 'linear-gradient(225deg, #ffffff 0%, #fafafa 50%, #f5f5f5 100%)' },
  { id: 'aged', bg: 'bg-amber-100', gradient: 'linear-gradient(225deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)' },
  { id: 'parchment', bg: 'bg-orange-50', gradient: 'linear-gradient(225deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)' },
  { id: 'blue', bg: 'bg-blue-50', gradient: 'linear-gradient(225deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)' },
  { id: 'pink', bg: 'bg-pink-50', gradient: 'linear-gradient(225deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)' },
  { id: 'mint', bg: 'bg-emerald-50', gradient: 'linear-gradient(225deg, #ecfdf5 0%, #d1fae5 50%, #a7f3d0 100%)' },
  { id: 'lavender', bg: 'bg-purple-50', gradient: 'linear-gradient(225deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)' },
  { id: 'peach', bg: 'bg-orange-100', gradient: 'linear-gradient(225deg, #ffedd5 0%, #fed7aa 50%, #fdba74 100%)' },
  { id: 'sky', bg: 'bg-sky-50', gradient: 'linear-gradient(225deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)' },
]

interface ExactPageRendererProps {
  page: StoryPage
  pageIndex: number
  totalPages: number
  pageColor?: PageColor
  showLines?: boolean
  width: number
  height: number
}

export function ExactPageRenderer({
  page,
  pageIndex,
  totalPages,
  pageColor = 'cream',
  showLines = true,
  width,
  height,
}: ExactPageRendererProps) {
  const style: TextStyle = page.style || {}
  const colorConfig = PAGE_COLORS.find(c => c.id === pageColor) || PAGE_COLORS[0]

  const isFrontCover = pageIndex === 0
  const isBackCover = pageIndex === totalPages - 1 && totalPages > 1

  // Shared scale from pageRendering.ts
  const scale = getPageScale(width)

  // Text styles — use shared formulas (same as BookMode)
  const fontSize = style.fontSize || 18
  const lineSpacing = (style.lineSpacing || 'normal') as LineSpacing
  const scaledFontSize = getScaledFontSize(fontSize, width)
  const scaledLineHeight = getScaledLineHeightPx(lineSpacing, width)
  const fontFamily = style.fontFamily || 'Georgia, serif'

  return (
    <div
      className="printable-page"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: colorConfig.gradient,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background media */}
      {page.backgroundMedia && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          {page.backgroundMedia.type === 'video' ? (
            <video
              src={page.backgroundMedia.url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: page.backgroundMedia.opacity,
                transform: `translate(${page.backgroundMedia.x || 0}px, ${page.backgroundMedia.y || 0}px) scale(${page.backgroundMedia.scale || 1})`,
                transformOrigin: 'center center',
              }}
              muted
              playsInline
            />
          ) : (
            <img
              src={page.backgroundMedia.url}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: page.backgroundMedia.opacity,
                transform: `translate(${page.backgroundMedia.x || 0}px, ${page.backgroundMedia.y || 0}px) scale(${page.backgroundMedia.scale || 1})`,
                transformOrigin: 'center center',
              }}
            />
          )}
        </div>
      )}

      {/* Paper texture removed for print — screen-only effect */}

      {/* Notebook lines — paddings in % (aligned with BookMode) */}
      {showLines && !isFrontCover && !isBackCover && (
        <div
          style={{
            position: 'absolute',
            left: PAGE_PADDING.left,
            right: PAGE_PADDING.right,
            top: PAGE_PADDING.top,
            bottom: PAGE_PADDING.bottom,
            backgroundImage: `repeating-linear-gradient(transparent, transparent ${scaledLineHeight - 1}px, rgba(139, 115, 85, 0.15) ${scaledLineHeight - 1}px, rgba(139, 115, 85, 0.15) ${scaledLineHeight}px)`,
            backgroundSize: `100% ${scaledLineHeight}px`,
            zIndex: 2,
          }}
        />
      )}

      {/* Red margin — paddings in % (aligned with BookMode) */}
      {showLines && !isFrontCover && !isBackCover && (
        <div
          style={{
            position: 'absolute',
            right: PAGE_PADDING.right,
            top: PAGE_PADDING.top,
            bottom: PAGE_PADDING.bottom,
            width: '1px',
            backgroundColor: 'rgba(252, 165, 165, 0.4)',
            zIndex: 2,
          }}
        />
      )}

      {/* Floating images — NO translate(-50%, -50%), same as BookMode */}
      {page.images?.map((media: PageMedia) => (
        <div
          key={media.id}
          style={{
            position: 'absolute',
            left: `${media.position.x}%`,
            top: `${media.position.y}%`,
            width: `${media.position.width}%`,
            height: `${media.position.height}%`,
            transform: media.position.rotation ? `rotate(${media.position.rotation}deg)` : undefined,
            zIndex: media.zIndex || 10,
          }}
        >
          {media.type === 'video' ? (
            <video
              src={media.url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: (media as PageMedia & { opacity?: number }).opacity ?? 1,
              }}
              muted
              playsInline
            />
          ) : (
            <img
              src={media.url}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: (media as PageMedia & { opacity?: number }).opacity ?? 1,
              }}
            />
          )}
        </div>
      ))}

      {/* Decorations — base size from shared constant, deco.scale in transform */}
      {page.decorations?.map((deco: PageDecoration) => {
        const decorationItem = PREMIUM_DECORATIONS.find(d => d.id === deco.decorationId)
        if (!decorationItem) return null

        const color = deco.color || decorationItem.defaultColor || '#D4AF37'
        const coloredSvg = decorationItem.svg.replace(/currentColor/g, color)
        const size = DECORATION_BASE_SIZE // 64px fixe, comme l'éditeur (DraggableDecoration)

        return (
          <div
            key={deco.id}
            style={{
              position: 'absolute',
              left: `${deco.position.x}%`,
              top: `${deco.position.y}%`,
              width: `${size}px`,
              height: `${size}px`,
              transform: [
                'translate(-50%, -50%)', // centrer sur le point, comme l'éditeur
                `rotate(${deco.rotation || 0}deg)`,
                deco.scale && deco.scale !== 1 ? `scale(${deco.scale})` : '',
                deco.flipX ? 'scaleX(-1)' : '',
                deco.flipY ? 'scaleY(-1)' : '',
              ].filter(Boolean).join(' '),
              opacity: deco.opacity || 1,
              zIndex: 100,
              filter: deco.glow ? 'drop-shadow(0 0 8px gold)' : undefined,
            }}
            dangerouslySetInnerHTML={{ __html: coloredSvg }}
          />
        )
      })}

      {/* Floating text boxes — NO translate(-50%, -50%), height included */}
      {page.textBoxes?.map((textBox: PageTextBox) => {
        const tbLineHeight = getScaledLineHeightPx((textBox.style?.lineSpacing || 'normal') as LineSpacing, width)
        return (
          <div
            key={textBox.id}
            style={{
              position: 'absolute',
              left: `${textBox.position.x}%`,
              top: `${textBox.position.y}%`,
              width: `${textBox.position.width}%`,
              height: `${textBox.position.height}%`,
              transform: textBox.rotation ? `rotate(${textBox.rotation}deg)` : undefined,
              padding: '8px',
              backgroundColor: textBox.style?.backgroundColor || 'transparent',
              borderRadius: '8px',
              fontFamily: textBox.style?.fontFamily || 'Georgia, serif',
              fontSize: `${getScaledFontSize(textBox.style?.fontSize || 14, width)}px`,
              lineHeight: `${tbLineHeight}px`,
              color: textBox.style?.color || '#3d3426',
              textAlign: textBox.style?.textAlign || 'center',
              fontWeight: textBox.style?.isBold ? 'bold' : 'normal',
              fontStyle: textBox.style?.isItalic ? 'italic' : 'normal',
              zIndex: textBox.zIndex || 50,
            }}
          >
            {textBox.content}
          </div>
        )
      })}

      {/* Main text zone — paddings in % (aligned with BookMode) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          paddingLeft: PAGE_PADDING.left,
          paddingRight: PAGE_PADDING.right,
          paddingTop: PAGE_PADDING.top,
          paddingBottom: PAGE_PADDING.bottom,
          zIndex: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            fontFamily,
            fontSize: `${scaledFontSize}px`,
            lineHeight: `${scaledLineHeight}px`,
            fontWeight: style.isBold ? 'bold' : 'normal',
            fontStyle: style.isItalic ? 'italic' : 'normal',
            textAlign: style.textAlign || 'left',
            color: '#3d3426',
            height: '100%',
          }}
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
      </div>

      {/* Page number */}
      {!isFrontCover && !isBackCover && (
        <div
          style={{
            position: 'absolute',
            bottom: `${12 * scale}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'Georgia, serif',
            fontSize: `${12 * scale}px`,
            color: 'rgba(139, 115, 85, 0.6)',
            zIndex: 100,
          }}
        >
          — {pageIndex + 1} —
        </div>
      )}

      {/* Cover labels */}
      {(isFrontCover || isBackCover) && (
        <div
          style={{
            position: 'absolute',
            bottom: `${12 * scale}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'Georgia, serif',
            fontSize: `${10 * scale}px`,
            fontWeight: 'bold',
            color: isFrontCover ? '#f59e0b' : '#10b981',
            zIndex: 100,
          }}
        >
          {isFrontCover ? 'COUVERTURE' : '4EME DE COUVERTURE'}
        </div>
      )}
    </div>
  )
}

export default ExactPageRenderer
