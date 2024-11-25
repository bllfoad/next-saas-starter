'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Star, ChevronLeft, ChevronRight, Shuffle, X, Check, Plus, Trash2, Pencil, Settings2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog"
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical } from 'lucide-react'

interface Flashcard {
  id: number
  term: string
  definition: string
  hint?: string
  explanation?: string
  source?: string
  page?: number
  keyConcept?: string
  showMore?: boolean
}

export default function FlashcardView() {
  const [cards, setCards] = useState<Flashcard[]>([
    {
      id: 1,
      term: "What are some common applications of computers in daily life?",
      definition: "Common applications include word processors, internet banking, online courses, GPS systems, and weather forecasting.",
      hint: "Think about the different ways you use computers throughout your day.",
      explanation: "Computers have become integral to daily life, offering solutions for both personal and professional tasks.",
      source: "Introduction to Computing",
      page: 1,
      keyConcept: "Computer Applications",
      showMore: false
    },
    {
      id: 2,
      term: "Where are computers commonly used?",
      definition: "Computers are commonly used at home, work, and school, and are also embedded in devices like cars and smartphones.",
      hint: "Consider different environments where you might see or use a computer.",
      explanation: "Computers are versatile tools found in various settings, enhancing productivity and connectivity in personal, professional, and educational contexts.",
      source: "Introduction to Computers",
      page: 2,
      keyConcept: "Computer Usage",
      showMore: false
    }
  ])
  const [cardHistory, setCardHistory] = useState<Flashcard[][]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isStarred, setIsStarred] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [editedTerm, setEditedTerm] = useState('')
  const [editedDefinition, setEditedDefinition] = useState('')
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<number | null>(null)
  const [newCard, setNewCard] = useState<Flashcard>({
    id: 0,
    term: '',
    definition: '',
    hint: '',
    explanation: '',
    source: '',
    page: undefined,
    keyConcept: '',
    showMore: false
  })

  // Save current state to history when making changes
  const saveToHistory = (newCards: Flashcard[]) => {
    const newHistory = cardHistory.slice(0, currentHistoryIndex + 1)
    newHistory.push([...cards])
    setCardHistory(newHistory)
    setCurrentHistoryIndex(newHistory.length - 1)
    setCards(newCards)
  }

  // Undo changes
  const handleUndo = () => {
    if (currentHistoryIndex >= 0) {
      setCards([...cardHistory[currentHistoryIndex]])
      setCurrentHistoryIndex(currentHistoryIndex - 1)
    }
  }

  // Redo changes
  const handleRedo = () => {
    if (currentHistoryIndex < cardHistory.length - 1) {
      setCards([...cardHistory[currentHistoryIndex + 1]])
      setCurrentHistoryIndex(currentHistoryIndex + 1)
    }
  }

  // Handle changes to cards
  const handleCardChange = (newCards: Flashcard[]) => {
    saveToHistory(newCards)
  }

  const handlePrevCard = () => {
    setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length)
    setIsFlipped(false)
    setIsEditing(false)
  }

  const handleNextCard = () => {
    setCurrentCard((prev) => (prev + 1) % cards.length)
    setIsFlipped(false)
    setIsEditing(false)
  }

  const handleShuffle = () => {
    setCurrentCard(Math.floor(Math.random() * cards.length))
    setIsFlipped(false)
    setIsEditing(false)
  }

  const handleStartEdit = (card: Flashcard) => {
    setEditingCard({ ...card })
    setEditedTerm(card.term)
    setEditedDefinition(card.definition)
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (!editingCard) return

    const newCards = cards.map(card =>
      card.id === editingCard.id
        ? { 
            ...editingCard,
            term: editedTerm,
            definition: editedDefinition
          }
        : card
    )
    handleCardChange(newCards)
    setIsEditing(false)
    setEditingCard(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditingCard(null)
  }

  const handleAddCard = () => {
    if (newCard.term.trim() && newCard.definition.trim()) {
      setCards(prevCards => [
        ...prevCards,
        {
          ...newCard,
          id: Math.max(...prevCards.map(c => c.id)) + 1,
        }
      ])
      setNewCard({
        id: 0,
        term: '',
        definition: '',
        hint: '',
        explanation: '',
        source: '',
        page: undefined,
        keyConcept: '',
        showMore: false
      })
    }
  }

  const handleDeleteCard = (id: number) => {
    setCards(prevCards => prevCards.filter(card => card.id !== id))
    setCardToDelete(null)
  }

  // Handle drag end
  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    
    const newCards = Array.from(cards)
    const [reorderedItem] = newCards.splice(result.source.index, 1)
    newCards.splice(result.destination.index, 0, reorderedItem)
    
    handleCardChange(newCards)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsStarred(!isStarred)}
        >
          <Star className={`h-4 w-4 mr-2 ${isStarred ? 'fill-yellow-400' : ''}`} />
          {isStarred ? 'Starred' : 'Star'}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setIsManageDialogOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Manage cards
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center p-8">
          <div
            className={`w-full max-w-2xl aspect-video bg-card rounded-xl shadow-lg p-8 cursor-pointer transform transition-transform duration-500 ${
              isFlipped ? 'scale-95' : ''
            }`}
            onClick={() => !isEditing && setIsFlipped(!isFlipped)}
          >
            {isEditing && editingCard?.id === cards[currentCard].id ? (
              <div className="h-full flex flex-col overflow-y-auto">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Term <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={editedTerm}
                      onChange={(e) => setEditedTerm(e.target.value)}
                      placeholder="Enter term"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Definition <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={editedDefinition}
                      onChange={(e) => setEditedDefinition(e.target.value)}
                      placeholder="Enter definition"
                      className="h-32"
                    />
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (editingCard) {
                          const updatedCard = { 
                            ...editingCard, 
                            showMore: !editingCard.showMore 
                          }
                          setEditingCard(updatedCard)
                        }
                      }}
                    >
                      {editingCard?.showMore ? 'Show less' : 'Show more options'}
                    </Button>
                  </div>

                  {editingCard?.showMore && (
                    <div className="space-y-4 pl-4 border-l-2">
                      <div>
                        <label className="block text-sm font-medium mb-2">Hint</label>
                        <Input
                          value={editingCard.hint || ''}
                          onChange={(e) => {
                            if (editingCard) {
                              setEditingCard({
                                ...editingCard,
                                hint: e.target.value
                              })
                            }
                          }}
                          placeholder="Add a hint for this card"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Explanation</label>
                        <Textarea
                          value={editingCard.explanation || ''}
                          onChange={(e) => {
                            if (editingCard) {
                              setEditingCard({
                                ...editingCard,
                                explanation: e.target.value
                              })
                            }
                          }}
                          placeholder="Add a detailed explanation"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Source</label>
                          <Input
                            value={editingCard.source || ''}
                            onChange={(e) => {
                              if (editingCard) {
                                setEditingCard({
                                  ...editingCard,
                                  source: e.target.value
                                })
                              }
                            }}
                            placeholder="Source document or reference"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Page</label>
                          <Input
                            type="number"
                            value={editingCard.page || ''}
                            onChange={(e) => {
                              if (editingCard) {
                                setEditingCard({
                                  ...editingCard,
                                  page: parseInt(e.target.value) || undefined
                                })
                              }
                            }}
                            placeholder="Page number"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Key concept</label>
                        <Input
                          value={editingCard.keyConcept || ''}
                          onChange={(e) => {
                            if (editingCard) {
                              setEditingCard({
                                ...editingCard,
                                keyConcept: e.target.value
                              })
                            }
                          }}
                          placeholder="Main concept or topic"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-2xl font-medium mb-4">
                      {isFlipped ? cards[currentCard].definition : cards[currentCard].term}
                    </h3>
                    {cards[currentCard].hint && !isFlipped && (
                      <p className="text-muted-foreground mt-2">Hint: {cards[currentCard].hint}</p>
                    )}
                    {cards[currentCard].explanation && isFlipped && (
                      <p className="text-muted-foreground mt-4">{cards[currentCard].explanation}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Card {currentCard + 1} of {cards.length}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit(cards[currentCard])
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsStarred(!isStarred)
                      }}
                    >
                      {isStarred ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-2" />
                Manage cards
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader className="sticky top-0 bg-background z-10 pb-4 mb-4 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">Edit Flashcards</DialogTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsManageDialogOpen(false)}>
                      Go Back
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUndo}
                      disabled={currentHistoryIndex < 0}
                    >
                      Undo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRedo}
                      disabled={currentHistoryIndex >= cardHistory.length - 1}
                    >
                      Redo
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => setIsManageDialogOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="flashcards">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="mb-8 p-4 bg-muted/50 rounded-lg relative group"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <h3 className="text-lg font-medium">Card {index + 1}</h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newCards = [
                                      ...cards,
                                      { ...card, id: Math.max(...cards.map(c => c.id)) + 1 }
                                    ]
                                    handleCardChange(newCards)
                                  }}
                                >
                                  Add below
                                </Button>
                              </div>

                              <div className="space-y-4">
                                {isEditing && editingCard?.id === card.id ? (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-2">
                                        Term <span className="text-red-500">*</span>
                                      </label>
                                      <Input
                                        value={editedTerm}
                                        onChange={(e) => setEditedTerm(e.target.value)}
                                        placeholder="Enter the term or question"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-2">
                                        Definition <span className="text-red-500">*</span>
                                      </label>
                                      <Textarea
                                        value={editedDefinition}
                                        onChange={(e) => setEditedDefinition(e.target.value)}
                                        placeholder="Enter the definition or answer"
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                        Cancel
                                      </Button>
                                      <Button size="sm" onClick={handleSaveEdit}>
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Term <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1">{card.term}</div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStartEdit(card)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-2">
                                        Definition <span className="text-red-500">*</span>
                                      </label>
                                      <div>{card.definition}</div>
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newCards = cards.map(c =>
                                        c.id === card.id ? { ...c, showMore: !c.showMore } : c
                                      )
                                      handleCardChange(newCards)
                                    }}
                                  >
                                    {card.showMore ? 'Show less' : 'Show more options'}
                                  </Button>
                                </div>

                                {card.showMore && (
                                  <div className="space-y-4 pl-4 border-l-2">
                                    <div>
                                      <label className="block text-sm font-medium mb-2">Hint</label>
                                      <Input
                                        value={card.hint || ''}
                                        onChange={(e) => {
                                          const newCards = cards.map(c =>
                                            c.id === card.id ? { ...c, hint: e.target.value } : c
                                          )
                                          handleCardChange(newCards)
                                        }}
                                        placeholder="Add a hint for this card"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium mb-2">Explanation</label>
                                      <Textarea
                                        value={card.explanation || ''}
                                        onChange={(e) => {
                                          const newCards = cards.map(c =>
                                            c.id === card.id ? { ...c, explanation: e.target.value } : c
                                          )
                                          handleCardChange(newCards)
                                        }}
                                        placeholder="Add a detailed explanation"
                                        rows={2}
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-2">Source</label>
                                        <Input
                                          value={card.source || ''}
                                          onChange={(e) => {
                                            const newCards = cards.map(c =>
                                              c.id === card.id ? { ...c, source: e.target.value } : c
                                            )
                                            handleCardChange(newCards)
                                          }}
                                          placeholder="Source document or reference"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium mb-2">Page</label>
                                        <Input
                                          type="number"
                                          value={card.page || ''}
                                          onChange={(e) => {
                                            const newCards = cards.map(c =>
                                              c.id === card.id ? { ...c, page: parseInt(e.target.value) || undefined } : c
                                            )
                                            handleCardChange(newCards)
                                          }}
                                          placeholder="Page number"
                                        />
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium mb-2">Key concept</label>
                                      <Input
                                        value={card.keyConcept || ''}
                                        onChange={(e) => {
                                          const newCards = cards.map(c =>
                                            c.id === card.id ? { ...c, keyConcept: e.target.value } : c
                                          )
                                          handleCardChange(newCards)
                                        }}
                                        placeholder="Main concept or topic"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  const newCards = [
                    ...cards,
                    {
                      id: Math.max(...cards.map(c => c.id)) + 1,
                      term: '',
                      definition: '',
                      showMore: false
                    }
                  ]
                  handleCardChange(newCards)
                }}
              >
                Add New Card
              </Button>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handlePrevCard}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentCard + 1} / {cards.length}
          </span>
          <Button variant="ghost" size="sm" onClick={handleNextCard}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
